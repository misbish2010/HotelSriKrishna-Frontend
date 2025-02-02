import './RoomTable.css';
import { Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from "date-fns";
import { fetchBookingDashboard } from '../api';

import { useNavigate } from "react-router-dom";

const BookingDashboard = ({ onViewBooking }) => {

    const [bookingTableData, setBookingTableData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [windowPeriod, setWindowPeriod] = useState(24);
  const [selectedFromDate, setSelectedFromDate] = useState(new Date());
  const [selectedToDate, setSelectedToDate] = useState(new Date());
    const formatDate = (date) => format(date, "dd/MM/yyyy hh:mm a");


const handleFromDateChange = (date) => {
    if (date > selectedToDate) {
      alert("From Date cannot be greater than To Date.");
      return;
    }
    setSelectedFromDate(date);
  };

  const handleToDateChange = (date) => {
    if (date < selectedFromDate) {
      alert("To Date cannot be less than From Date.");
      return;
    }
    setSelectedToDate(date);
  };

const transformToRoomTable = (booked_rooms = [], checked_out_rooms = [], available_rooms = []) => {
    // Helper function to group bookings by booking_id
    const groupByBookingID = (rooms) => {
        return rooms.reduce((acc, room) => {
            (room.bookings || []).forEach((booking) => {
                const existingBooking = acc[booking.booking_id] || {
                    bookingID: booking.booking_id || '-',
                    customerName: booking.customer_name || '-',
                    customerContact: booking.customer_contact || '-',
                    bookingStatus: booking.booking_status || '-',
                    paidAmount: booking.payment_details.reduce(
                        (total, payment) => total + payment.payment_amount,
                        0
                    ),
                    totalPrice: 0, // Will be calculated below
                    pricePerNight: booking.final_price_per_night || 0.0,
                    durationOfStay: room.duration_of_stay[0] || '-',
                    checkInDate: formatDate(room.check_in_dates[0] || '-'),
                    probableCheckOutDate: formatDate(room.probable_check_out_dates[0] || '-'),
                    paymentDetails: booking.payment_details || [],
                    rooms: [], // Collect room details here
                };

                // Add room details to the existing booking
                existingBooking.rooms.push({
                    roomNumber: room.room_number,
                    roomType: `${room.is_ac ? 'AC' : ''} ${room.occupancy} ${room.room_type}`,
                });

                // Calculate total price
                existingBooking.totalPrice =
                    (room.duration_of_stay[0] || 0) * (booking.final_price_per_night || 0);

                // Save back to the grouped object
                acc[booking.booking_id] = existingBooking;
            });
            return acc;
        }, {});
    };

    // Transform booked rooms
    const bookedGrouped = groupByBookingID(booked_rooms);
    const bookedRoomList = Object.values(bookedGrouped).map((booking) => ({
        bookingID: booking.bookingID,
        customerName: booking.customerName,
        customerContact: booking.customerContact,
        bookingStatus: booking.bookingStatus,
        paidAmount: booking.paidAmount,
        totalPrice: booking.totalPrice,
        pricePerNight: booking.pricePerNight,
        durationOfStay: booking.durationOfStay,
        checkInDate: booking.checkInDate,
        probableCheckOutDate: booking.probableCheckOutDate,
        rooms: booking.rooms
            .map((room) => `${room.roomNumber}-${room.roomType}`)
            .join(', '), // Combine room details into a single string
        paymentDetails: booking.paymentDetails,
    }));

    // Transform checked-out rooms
    const checkedOutGrouped = groupByBookingID(checked_out_rooms);
    console.log(checked_out_rooms)
    const checkedOutRoomList = Object.values(checkedOutGrouped).map((booking) => ({
        bookingID: booking.bookingID,
        customerName: booking.customerName,
        customerContact: booking.customerContact,
        bookingStatus: "Checked-Out",
        paidAmount: booking.paidAmount,
        totalPrice: booking.totalPrice,
        pricePerNight: booking.pricePerNight,
        durationOfStay: booking.durationOfStay,
        checkInDate: booking.checkInDate,
        probableCheckOutDate: booking.probableCheckOutDate,
        rooms: booking.rooms
            .map((room) => `${room.roomNumber}-${room.roomType}`)
            .join(', '),
        paymentDetails: booking.paymentDetails,
    }));
    console.log(checkedOutRoomList)

    // Transform available rooms
    const availableRoomList = (available_rooms || []).map((room) => ({
        bookingID: '-',
        rooms: `${room.room_number}-${room.room_type}`,
        customerName: '-',
        customerContact: '-',
        bookingStatus: 'Available',
        paidAmount: '-',
        totalPrice: '-',
        pricePerNight: '-',
        durationOfStay: '-',
        checkInDate: '-',
        probableCheckOutDate: '-',
        paymentDetails: [],
    }));

    // Combine all room lists
    const combinedRoomList = [
        ...bookedRoomList,
        ...checkedOutRoomList,
        ...availableRoomList,
    ];
    console.log(checkedOutRoomList)
    // Sort combined list by room number (ascending)
    combinedRoomList.sort((a, b) => {
        const numA = parseInt(a.rooms.split('-')[0], 10);
        const numB = parseInt(b.rooms.split('-')[0], 10);
        return numA - numB || a.rooms.localeCompare(b.rooms);
    });

    console.log(combinedRoomList);
    return combinedRoomList;
};




    const fetchRoomData = async () => {
        try {
        console.log(selectedFromDate)
        console.log(selectedToDate)
            const data = await fetchBookingDashboard(selectedFromDate, selectedToDate);
            const transformedData = transformToRoomTable(data.booked_rooms,data.checked_out_rooms, data.available_rooms);
            setBookingTableData(transformedData);
        } catch (error) {
            console.error("Error fetching room data:", error);
        }
    };

    useEffect(() => {
        fetchRoomData();
    }, [selectedFromDate, selectedToDate]);

    return (
        <div className="room-grid-container" style={{ padding: '20px' }}>
            {/* Controls Section */}
            <div className="controls-row mb-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">

{/* From Date Picker */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <label
              style={{
                fontWeight: "bold",
                marginRight: "10px",
                whiteSpace: "nowrap",
              }}
            >
              Select From Date:
            </label>
            <DatePicker
              selected={selectedFromDate}
              onChange={handleFromDateChange}
              dateFormat="dd/MM/yyyy"
              className="form-control"
            />
          </div>
          {/* To Date Picker */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <label
              style={{
                fontWeight: "bold",
                marginRight: "10px",
                whiteSpace: "nowrap",
              }}
            >
              Select To Date:
            </label>
            <DatePicker
              selected={selectedToDate}
              onChange={handleToDateChange}
              dateFormat="dd/MM/yyyy"
              className="form-control"
              minDate={selectedFromDate}

            />
          </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="table-container bg-white p-3 rounded shadow-sm">
                <table className="table table-hover table-bordered">
                    <thead className="table-primary">
                        <tr>
                            <th>Booking ID</th>
                            <th>Room Details</th>
                            <th>Guest Name</th>
                            <th>Check-in Date</th>
                            <th>Probable Check-out Date</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookingTableData.map((room, index) => (
                            <tr key={index}>
                                <td>{room.bookingID}</td>
                                <td>{room.rooms}</td>
                                <td>{room.customerName}</td>
                                <td>{room.checkInDate}</td>
                                <td>{room.probableCheckOutDate}</td>
                                <td>{room.durationOfStay}</td>
                                <td>
                                    <span
                                        className={`badge ${
                                            room.bookingStatus === 'Available'
                                                ? 'bg-success'
                                                : room.bookingStatus === 'Confirmed'
                                                ? 'bg-primary text-dark'
                                                : room.bookingStatus === 'Checked-Out'
                                                ? 'bg-secondary text-dark'
                                                : 'bg-danger'
                                        }`}
                                    >
                                        {room.bookingStatus}
                                    </span>
                                </td>

                                <td>
                                    {room.bookingStatus === 'Available'
                                        ? '-'
                                        : `₹${room.paidAmount}`}
                                </td>
                                <td>
                                    {room.bookingStatus === 'Available'
                                        ? '-'
                                        : `₹${room.totalPrice - room.paidAmount}`}
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                    {room.bookingStatus !== 'Available' && (
                                        <OverlayTrigger
                                            overlay={<Tooltip>View Details</Tooltip>}
                                        >
                                            <Button
                                                variant="info"
                                                size="sm"
                                                onClick={() => onViewBooking(room.bookingID,room.bookingStatus)}

                                            >
                                                View
                                            </Button>
                                        </OverlayTrigger>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingDashboard;
