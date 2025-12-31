import React, { useEffect, useState } from "react";
import { Row, Col, Form, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { fetchDailyChart } from "../api";
import "./room-availability.css";
import { PageHeader } from "./common/PageHeader";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { FcCopyright } from "react-icons/fc";
import { BsCSquareFill } from "react-icons/bs";
import { BsCCircleFill } from "react-icons/bs";
import { BsCCircle } from "react-icons/bs";

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

export default function RoomDailyGrid() {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [nights, setNights] = useState(1);
  const [rooms, setRooms] = useState({});

  useEffect(() => {
    loadData();
  }, [startDate, nights]);

  const loadData = async () => {
    const res = await fetchDailyChart(startDate, nights);
    console.log(res)
    // backend gives array → convert to map by room_number
    const roomMap = {};
    (res.rooms || []).forEach((r) => {
      roomMap[r.room_number] = r;
    });

    setRooms(roomMap);
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
    room.current_guest_name || room.next_guest_name;

  return (
   <>
   <PageHeader
                 title="Rooms – Daily Grid"
                 subtitle="Room availability for selected date"
                 badge="Daily"
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

{[
  "checkout_available",
  "checkout_to_new_booking",
  "checkout"
].includes(statusClass) && (
  <BsCSquareFill className="checkout-icon" />
)}
{[
  "checked_in",
  "new_booking"
].includes(statusClass) && (
  <FaPersonWalkingLuggage className="checkin-icon" />
)}


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

        <div className="legend-box">
          <h6>Legend</h6>

          <div className="legend-item">
            <span className="legend-color available" /> Available
          </div>

          <div className="legend-item">
            <span className="legend-color checked_in" /> Checked-In / Continue
          </div>

          <div className="legend-item">
            <span className="legend-color new_booking" /> New Booking / Continue
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
