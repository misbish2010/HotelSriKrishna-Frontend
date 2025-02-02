import { Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse } from "date-fns";
import { fetchRoomStatus } from '../api';

function RoomGrid() {

{/* Primary: #0d6efd
    Secondary: #6c757d
    Success: #198754
    Warning: #ffc107
    Danger: #dc3545
    Info: #0dcaf0
    Light: #f8f9fa
    Dark: #212529
 */}

const statuses = [
    { label: "Available", color: "green" },
    { label: "Checked-In", color: "red" },
    { label: "<Probable Check-Out", color: "#ffc107" },
    { label: ">Probable Check-Out", color: "#0dcaf0" },
    { label: "~Check-Out", color: "#6c757d" },
    { label: "Confirmed", color: "#0d6efd" },
  ];
    const [roomRows, setRoomRows] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default to current date and time
    const [windowPeriod, setWindowPeriod] = useState(24); // Default to 12 hours

    // Formatting the date in dd/mm/yyyy hh:mm AM/PM format
    const formatDate = (date) => {
        return format(date, "dd/MM/yyyy hh:mm a");
    };

    const renderTooltip = (props, checkInTime) => (

        <Tooltip {...props}>
            Check in Time: {formatDate(checkInTime)}
        </Tooltip>
    );

    const transformToRoomRows = (booked_rooms, available_rooms) => {
        const groupedRooms = [];
        const roomsPerRow = 5; // Number of rooms per row (adjust as needed)
        console.log(booked_rooms)
        // Map API data to the desired structure
        const booked_roomList = booked_rooms.map((room) => ({
            roomNumber: room.room_number,
            status: room.bookings[0].booking_status,
            checkInTime: room.check_in_dates,
            probableCheckOutTime : room.probable_check_out_dates,
            durationOfStay: room.duration_of_stay,
        }));
        console.log(booked_roomList)
        const available_roomList = available_rooms.map((room) => ({
            roomNumber: room.room_number,
            status: 'available',
            checkInTime: null,
            durationOfStay: null
        }));
        const roomList = [
            ...booked_roomList, // Spread booked rooms
            ...available_roomList, // Spread available rooms
        ];
        roomList.sort((a, b) => a.roomNumber - b.roomNumber); // Sorting rooms by number


        // Split rooms into rows
        if (roomList.length > 0) {
            // Add the first row with exactly 2 elements
            groupedRooms.push(roomList.slice(0, 2));

            // Start slicing for the remaining rows
            for (let i = 2; i < roomList.length; i += roomsPerRow) {
                groupedRooms.push(roomList.slice(i, i + roomsPerRow));
            }
        }

        return groupedRooms;
    };

    const fetchRoomData = async () => {
        try {
            console.log(selectedDate);
            const data = await fetchRoomStatus(selectedDate, windowPeriod);
            console.log(data);
            const transformedData = transformToRoomRows(data.booked_rooms, data.available_rooms);
            setRoomRows(transformedData);
        } catch (error) {
            console.error("Error fetching room data:", error);
        }
    };
    // Trigger fetching when selectedDate or windowPeriod changes
    useEffect(() => {
        fetchRoomData();
    }, [selectedDate, windowPeriod]);

    function getRoomStatusColor(room) {

        const currentTime = new Date();
        // If the room is available
        if (room.status === 'available') {
            return 'success'; // Green
        }
        if (room.status === 'Confirmed') {
            return 'primary'; // Blue
        }

        // Probable checkout time logic
        const probableCheckOutTime = room.probableCheckOutTime
            ? new Date(room.probableCheckOutTime)
            : null;
        console.log(room)
        console.log(probableCheckOutTime)
        if (
            probableCheckOutTime &&
            probableCheckOutTime > currentTime &&
            probableCheckOutTime - currentTime <= 1 * 60 * 60 * 1000 // Within 1 hour of probable checkout
        ) {
            console.log("PROBABLE----------")
            return 'warning'; // Yellow
        }

        // Final checkout time logic
        const finalCheckOutTime = new Date(new Date(room.checkInTime).getTime() + room.durationOfStay * 24 * 60 * 60 * 1000); // Calculate based on duration
        if (
            finalCheckOutTime &&
            finalCheckOutTime > currentTime &&
            finalCheckOutTime - currentTime <= 1 * 60 * 60 * 1000 // Within 1 hour of final checkout
        ) {
            console.log("FINAL---------------")
            return 'secondary'; // Some other color (e.g., blue)
        }
        if (
            finalCheckOutTime &&
            finalCheckOutTime > currentTime &&
            currentTime > probableCheckOutTime
        ) {
                console.log("FINAL---------------")
                return 'info'; // Some other color (e.g., blue)
          }
        console.log("LAST-----------")
        // Default case for occupied or other states
        return 'danger'; // Red
    }



return (
        <div className="room-grid-container" style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Main Room Grid */}
            <div className="room-grid" style={{ flex: 3, padding: '0px' }}>
                {roomRows.map((row, rowIndex) => (
                    <div className="room-row" key={rowIndex} style={{ marginBottom: '10px' }}>
                        {row.map((room) => (
                            <OverlayTrigger
                                key={room.roomNumber}
                                placement="top"
                                overlay={
                                    room.status === 'Checked-In' ||  room.status === 'Confirmed'
                                        ? (props) => renderTooltip(props, room.checkInTime)
                                        : <></>
                                }
                            >
                            <Button
                                variant={getRoomStatusColor(room)}
                                className="room-button"
                                style={{ margin: '10px', width: '80px', height: '80px', fontSize: '1.2rem' }}
                            >
                                {room.roomNumber}
                            </Button>


                            </OverlayTrigger>
                        ))}
                    </div>
                ))}
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
                        style={{ marginTop: '10px' }}
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
                    </select>
                </div>


<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

<label><strong>Colour Code</strong></label>
  {statuses.map((status) => (
    <div
      key={status.label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {/* Status Box */}
      <div
        style={{
          width: "20px",
          height: "20px",
          backgroundColor: status.color,
          borderRadius: "4px", // Optional: Slight rounding of corners
        }}
      ></div>
      {/* Status Label */}
      <span>{status.label}</span>
    </div>
  ))}
</div>
            </div>
        </div>
    );
}

export default RoomGrid;
