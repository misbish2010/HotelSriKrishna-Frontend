import { Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { fetchRoomStatus } from '../api';

function RoomGrid() {
  const statuses = [
    { label: "Available", color: "green" },
    { label: "Checked-In", color: "red" },
    { label: "<Probable Check-Out", color: "#ffc107" },
    { label: ">Probable Check-Out", color: "#0dcaf0" },
    { label: "~Check-Out", color: "#6c757d" },
    { label: "Confirmed", color: "#0d6efd" },
    { label: "Unknown", color: "#212529" },
  ];

  const [roomRows, setRoomRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [windowPeriod, setWindowPeriod] = useState(24);

  const formatDate = (date) => format(date, "dd/MM/yyyy hh:mm a");

const transformToRoomRows = (booked_rooms, available_rooms) => {
  console.log(booked_rooms);

  // ✅ FIX: include "Unknown" rooms that have no bookings
  const bookedList = booked_rooms.flatMap((room) => {
    if (room.bookings.length === 0) {
      return [{
        roomNumber: room.room_number,
        guestName: null,
        guestPhone: null,
        status: "Unknown",
        checkInTime: null,
        probableCheckOutTime: null,
        durationOfStay: null,
      }];
    }

    return room.bookings.map((booking) => ({
      roomNumber: room.room_number,
      guestName: booking.customer_name,
      guestPhone: booking.customer_contact,
      status: booking.booking_status,
      checkInTime: booking.check_in_date,
      probableCheckOutTime: booking.probable_check_out_date,
      durationOfStay: booking.duration_of_stay,
    }));
  });

  console.log(bookedList);

  const availableList = available_rooms.map((room) => ({
    roomNumber: room.room_number,
    status: 'Available',
    checkInTime: null,
    probableCheckOutTime: null,
    durationOfStay: null,
  }));

  const combined = [...bookedList, ...availableList];
  combined.sort((a, b) => a.roomNumber - b.roomNumber);

  // Group into rows (same as before)
  const grouped = [];
  const perRow = 5;
  if (combined.length > 0) {
    grouped.push(combined.slice(0, 3));
    for (let i = 3; i < combined.length; i += perRow)
      grouped.push(combined.slice(i, i + perRow));
  }
  return grouped;
};

  const fetchRoomData = async () => {
    try {
      const data = await fetchRoomStatus(selectedDate, windowPeriod);
      console.log(data)
      const transformed = transformToRoomRows(data.booked_rooms, data.available_rooms);
      setRoomRows(transformed);
    } catch (error) {
      console.error("Error fetching room data:", error);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [selectedDate, windowPeriod]);

// 🟩 Time-aware + status-aware color logic
function getRoomStatusColor(room) {
  const currentTime = new Date();

  // Handle explicit string status values (if present)
  if (room.status) {
    const status = room.status.toLowerCase();

    if (status === "available") return "success";   // Green
    if (status === "confirmed") return "primary";   // Blue
    if (status === "unknown") return "dark";        // Grey/Black
    if (status === "checked-in") {
      // Checked-In handled below with probable logic
    }
  }

  // ✅ Probable checkout time logic (yellow)
  const probableCheckOutTime = room.probableCheckOutTime
    ? new Date(room.probableCheckOutTime)
    : null;
  if (
    probableCheckOutTime &&
    probableCheckOutTime > currentTime &&
    probableCheckOutTime - currentTime <= 1 * 60 * 60 * 1000
  ) {
    // Within 1 hour before probable checkout
    return "warning"; // Yellow (<Probable Check-Out)
  }

  // ✅ Final checkout time logic
  let finalCheckOutTime = null;
  if (room.checkInTime && room.durationOfStay) {
    finalCheckOutTime = new Date(
      new Date(room.checkInTime).getTime() + room.durationOfStay * 24 * 60 * 60 * 1000
    );
  }

  if (
    finalCheckOutTime &&
    probableCheckOutTime &&
    finalCheckOutTime > currentTime &&
    currentTime > probableCheckOutTime
  ) {
    return "info"; // Light blue (>Probable Check-Out)
  }

  if (finalCheckOutTime && currentTime > finalCheckOutTime) {
    return "secondary"; // Grey (~Check-Out)
  }

  // Default for active stays
  return "danger"; // Red (Checked-In / Occupied)
}



  // New: flatten all rooms into one list to detect duplicates
  const getAllRoomsFlat = () => roomRows.flat();

  const findDuplicateRooms = (flatRooms) => {
    const map = {};
    flatRooms.forEach((room) => {
      if (!map[room.roomNumber]) map[room.roomNumber] = [];
      map[room.roomNumber].push(room);
    });
    return map;
  };

  const renderTooltip = (props, room) => {
    const laterBooking = room.find((r) => r.status === "Confirmed");
    if (laterBooking?.checkInTime)
      return (
        <Tooltip {...props}>
          {laterBooking.guestName} 📞{laterBooking.guestPhone} { }
            Next Check-In ⏰: {formatDate(new Date(laterBooking.checkInTime))}
        </Tooltip>
      );
    return <Tooltip {...props}>No upcoming booking</Tooltip>;
  };

  const flatRooms = getAllRoomsFlat();
  const groupedRooms = findDuplicateRooms(flatRooms);

  return (
    <div className="room-grid-container" style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Main Room Grid */}
      <div className="room-grid" style={{ flex: 3, padding: '0px' }}>

        <div className="room-grid" style={{ flex: 3, padding: '0px' }}>
          {(() => {
            // Convert groupedRooms object into a sorted array
            const roomArray = Object.entries(groupedRooms)
              .map(([roomNumber, entries]) => ({ roomNumber, entries }))
              .sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));

            // Apply your "2 + 5 per row" pattern
            const groupedLayout = [];
            if (roomArray.length > 0) {
              groupedLayout.push(roomArray.slice(0, 3)); // first row has 2
              for (let i = 3; i < roomArray.length; i += 5) {
                groupedLayout.push(roomArray.slice(i, i + 5));
              }
            }

            // Render each row
            return groupedLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="room-row" style={{ marginBottom: '10px', display: 'flex' }}>
                {row.map(({ roomNumber, entries }) => {
                  const isDuplicate = entries.length > 1;
                  if (isDuplicate) {
                    const top = entries[0];
                    const bottom = entries[1];
                    return (
                      <OverlayTrigger
                        key={roomNumber}
                        placement="top"
                        overlay={(props) => renderTooltip(props, entries)}
                      >
                        <div
                          style={{
                            display: 'inline-block',
                            width: '80px',
                            height: '80px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            margin: '10px',
                            position: 'relative',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                          }}
                        >
                          <div
                            style={{
                              height: '50%',
                              width: '100%',
                              backgroundColor: `var(--bs-${getRoomStatusColor(top)})`,
                            }}
                          />
                          <div
                            style={{
                              height: '50%',
                              width: '100%',
                              backgroundColor: `var(--bs-${getRoomStatusColor(bottom)})`,
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: 0,
                              right: 0,
                              textAlign: 'center',
                              transform: 'translateY(-50%)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            }}
                          >
                            {roomNumber}
                          </div>
                        </div>
                      </OverlayTrigger>
                    );
                  }

                  // Non-duplicate room
                  const room = entries[0];
                  return (
                    <OverlayTrigger
                      key={roomNumber}
                      placement="top"
                      overlay={
                        (room.guestName || room.checkInTime) ? (
                          <Tooltip>
                            {room.guestName && <div>{room.guestName}</div>}
                            {room.guestPhone && <div>📞 {room.guestPhone}</div>}
                            {room.checkInTime && (
                              <div>⏰ Check-In: {formatDate(new Date(room.checkInTime))}</div>
                            )}
                          </Tooltip>
                        ) : <></>
                      }
                    >
                      <Button
                        variant={getRoomStatusColor(room)}
                        style={{
                          margin: '10px',
                          width: '80px',
                          height: '80px',
                          fontSize: '1.2rem',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        }}
                      >
                        {roomNumber}
                      </Button>
                    </OverlayTrigger>
                  );
                })}
              </div>
            ));
          })()}
        </div>

      </div>

      {/* Controls Panel */}
      <div className="controls-panel" style={{ flex: 1, padding: '20px', borderLeft: '1px solid #ddd' }}>
        <div style={{ marginBottom: '20px' }}>
          <label><strong>Select Date and Time:</strong></label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            showTimeSelect
            timeFormat="HH:mm"
            dateFormat="dd/MM/yyyy, hh:mm a"
            className="form-control"
          />
        </div>

        <div>
          <label><strong>Select Window Period:</strong></label>
          <select
            value={windowPeriod}
            onChange={(e) => setWindowPeriod(Number(e.target.value))}
            className="form-select"
            style={{ marginTop: '10px' }}
          >
            <option value={4}>4 Hours</option>
            <option value={8}>8 Hours</option>
            <option value={12}>12 Hours</option>
            <option value={16}>16 Hours</option>
            <option value={24}>24 Hours</option>
            <option value={32}>32 Hours</option>
            <option value={48}>2 Days</option>
            <option value={72}>3 Days</option>
            <option value={96}>4 Days</option>
            <option value={120}>5 Days</option>
            <option value={144}>6 Days</option>
            <option value={168}>7 Days</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <label><strong>Colour Code</strong></label>
          {statuses.map((status) => (
            <div key={status.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: status.color,
                  borderRadius: "4px",
                }}
              ></div>
              <span>{status.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoomGrid;
