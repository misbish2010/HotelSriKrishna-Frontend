import React, { useEffect, useState } from "react";
import { Row, Col, Form, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { fetchDailyChart } from "../api";
import "./room-availability.css";
import { PageHeader } from "./common/PageHeader";

const ROOM_GROUPS = [
  ["001", "002", "003"],
  ["101", "102", "103", "104", "105"],
  ["201", "202", "203", "204", "205"],
  ["301", "302", "303", "304", "305"],
];

// backend status → css class
const normalizeStatus = (room) => {
  if (!room || !room.status) return "available";
  return room.status;
};

export default function RoomMultiNightGrid() {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [nights, setNights] = useState(1);
  const [rooms, setRooms] = useState({});

  useEffect(() => {
    loadRooms();
  }, [startDate, nights]);

const loadRooms = async () => {
    const dateList = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dateList.push(d.toISOString().slice(0, 10));
    }

    const dailyResults = await Promise.all(
      dateList.map((d) => fetchDailyChart(d))
    );

    // Aggregate by room_number
    const roomMap = {};
     console.log(dailyResults)

    dailyResults.forEach((day) => {
      day.rooms.forEach((r) => {
        if (!roomMap[r.room_number]) {
          roomMap[r.room_number] = [];
        }
        roomMap[r.room_number].push(r);
      });
    });
    console.log(roomMap)

    const finalRoomMap = {};

    Object.entries(roomMap).forEach(([roomNumber, entries]) => {
      const statuses = entries.map(e => e.status);

      let finalStatus = "available";
      let conflict = false;

      if (statuses.some(s =>
        ["checked_in", "continue_checked_in", "confirmed", "continue_confirmed", "new_booking"].includes(s)
      )) {
        finalStatus = "occupied";
      } else if (statuses.every(s => s === "available")) {
        finalStatus = "available";
        //conflict = true;
      }

      const sample = entries[0]; // for tooltip fields

      finalRoomMap[roomNumber] = {
        room_number: roomNumber,
        status: finalStatus,
        conflict,

        // tooltip fields
        current_guest_name: sample.current_guest_name,
        current_check_out_time: sample.current_check_out_time,
        next_guest_name: sample.next_guest_name,
        next_check_in_time: sample.next_check_in_time,
      };
    });

    setRooms(finalRoomMap);

  };

  // -----------------------------------
  // TOOLTIP RENDER (STATUS AWARE)
  // -----------------------------------
  const renderTooltip = (room) => {
    if (!room || !room.status) return null;

    return (
      <Tooltip id={`tooltip-${room.room_number}`}>
        {/* Checkout → New Booking */}
        {room.status === "checkout_to_new_booking" && (
          <>
            <div>
              <strong>Current:</strong> {room.current_guest_name || "—"}
            </div>
            {room.current_check_out_time && (
              <div className="text-danger">
                CO: {new Date(room.current_check_out_time).toLocaleTimeString()}
              </div>
            )}

            <hr className="my-1" />

            <div>
              <strong>Next:</strong> {room.next_guest_name || "—"}
            </div>
            {room.next_check_in_time && (
              <div className="text-primary">
                CI: {new Date(room.next_check_in_time).toLocaleTimeString()}
              </div>
            )}
          </>
        )}

        {/* Checked-in / Continue Checked-in */}
        {["checked_in", "continue_checked_in"].includes(room.status) && (
          <>
            <div>
              <strong>{room.current_guest_name || "—"}</strong>
            </div>
            {room.current_check_out_time && (
              <div className="text-danger">
                Checkout:{" "}
                {new Date(room.current_check_out_time).toLocaleString()}
              </div>
            )}
          </>
        )}

        {/* New booking / Continue confirmed */}
        {["new_booking", "continue_confirmed"].includes(room.status) && (
          <>
            <div>
              <strong>{room.next_guest_name || "—"}</strong>
            </div>
            {room.next_check_in_time && (
              <div className="text-primary">
                Check-in:{" "}
                {new Date(room.next_check_in_time).toLocaleString()}
              </div>
            )}
          </>
        )}

        {/* Checkout → Available */}
        {room.status === "checkout_available" && (
          <>
            <div>
              <strong>{room.current_guest_name || "—"}</strong>
            </div>
            {room.current_check_out_time && (
              <div className="text-danger">
                Checkout:{" "}
                {new Date(room.current_check_out_time).toLocaleString()}
              </div>
            )}
          </>
        )}
      </Tooltip>
    );
  };

const hasTooltip = (room) =>
  !!(
    room.current_guest_name ||
    room.next_guest_name ||
    room.current_check_out_time ||
    room.next_check_in_time
  );


  return (
    <>
    <PageHeader
      title="Rooms – Stay Planner"
      subtitle="Multi-night booking overlap & conflicts"
      badge="PLANNER"
    />

    <Row className="room-layout">
      {/* LEFT – ROOMS GRID */}
      <Col md={8}>
        {ROOM_GROUPS.map((group, rowIndex) => (
          <div
            key={rowIndex}
            className={`room-row ${rowIndex === 0 ? "center-row" : ""}`}
          >
            {group.map((roomNo) => {
              const room = rooms[roomNo] || {};
              const statusClass = normalizeStatus(room);

              const roomBox = (
                <div className={`room-box ${statusClass}`}>
                  {roomNo}
                  {room.conflict && (
                    <Badge bg="warning" className="conflict-badge">
                      !
                    </Badge>
                  )}
                </div>
              );

              return hasTooltip(room) ? (
                <OverlayTrigger
                  key={roomNo}
                  placement="top"
                  overlay={renderTooltip(room)}
                >
                  {roomBox}
                </OverlayTrigger>
              ) : (
                <div key={roomNo}>{roomBox}</div>
              );
            })}
          </div>
        ))}
      </Col>

      {/* RIGHT – CONTROLS + LEGEND */}
      <Col md={4} className="side-panel">
        <Form.Group className="mb-3">
          <Form.Label>
            <strong>Start Date</strong>
          </Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>
            <strong>Nights</strong>
          </Form.Label>
          <Form.Select
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} Night{n > 1 && "s"}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="legend-box">
          <h6>Legend</h6>

          <div className="legend-item">
            <span className="legend-color available" /> Available
          </div>

          <div className="legend-item">
            <span className="legend-color occupied" /> Occupied
          </div>

          <div className="legend-item">
            <Badge bg="warning">!</Badge> Conflict / Double Booking
          </div>
        </div>
      </Col>
    </Row>
    </>
  );
}
