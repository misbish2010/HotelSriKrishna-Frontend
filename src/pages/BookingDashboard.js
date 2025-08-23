import './RoomTable.css';
import { Button, Tooltip, OverlayTrigger, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from "date-fns";
import { fetchBookingDashboard } from '../api';

const BookingDashboard = ({ onViewBooking }) => {
  const [bookingTableData, setBookingTableData] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedFromDate, setSelectedFromDate] = useState(new Date());
  const [selectedToDate, setSelectedToDate] = useState(new Date());

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy hh:mm a");
    } catch {
      return "-";
    }
  };

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

  const fetchRoomData = async () => {
    try {
      const data = await fetchBookingDashboard(selectedFromDate, selectedToDate);
      console.log(data)
      // Directly use backend bookings
      const transformedBookings = (data.bookings || []).map((b) => {

        const paidAmount = (b.payment_info || [])
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPrice = b.total_price || 0;

        return {
          ...b,
          paidAmount,
          totalPrice,
          balance: Math.max(totalPrice - paidAmount, 0),
          rooms: (b.room_details || []).map((r, idx) => (
            <Badge key={idx} bg="info" className="me-1">
              {`${r.room_number} - ${r.is_ac ? "AC " : ""}${r.occupancy} ${r.room_type}`}
            </Badge>
          )),
          checkInDate: formatDate(b.stay_info?.check_in_date),
          probableCheckOutDate: formatDate(b.stay_info?.probable_check_out_date),
          durationOfStay: b.stay_info?.duration || "-"
        };
      });

      setBookingTableData(transformedBookings);
      setAvailableRooms(data.available_rooms || []);
    } catch (error) {
      console.error("Error fetching room data:", error);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [selectedFromDate, selectedToDate]);

  return (
    <div className="room-grid-container p-4">
      {/* Filters */}
      <div className="controls-row mb-3 d-flex gap-3">
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold">From:</label>
          <DatePicker
            selected={selectedFromDate}
            onChange={handleFromDateChange}
            dateFormat="dd/MM/yyyy"
            className="form-control"
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold">To:</label>
          <DatePicker
            selected={selectedToDate}
            onChange={handleToDateChange}
            dateFormat="dd/MM/yyyy"
            className="form-control"
            minDate={selectedFromDate}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container bg-white p-3 rounded shadow-sm">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-primary">
            <tr>
              <th>Booking ID</th>
              <th>Room(s)</th>
              <th>Guest Name</th>
              <th>Check-in</th>
              <th>Probable Check-out</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookingTableData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.booking_id}</td>
                <td>{row.rooms}</td>
                <td>{row.customer_info?.name || "-"}</td>
                <td>{row.checkInDate}</td>
                <td>{row.probableCheckOutDate}</td>
                <td>{row.durationOfStay}</td>
                <td>
                  <span className={`badge ${
                    row.booking_status === 'Available'
                      ? 'bg-success'
                      : row.booking_status === 'Confirmed'
                      ? 'bg-primary text-dark'
                      : row.booking_status === 'Checked-Out'
                      ? 'bg-secondary text-dark'
                      : 'bg-danger'
                  }`}>
                    {row.booking_status}
                  </span>
                </td>
                <td>₹{row.paidAmount}</td>
                <td>₹{row.balance}</td>
                <td>
                  {row.booking_status !== "Available" && (
                    <>
                      <OverlayTrigger overlay={<Tooltip>View / Manage Booking</Tooltip>}>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() =>
                            onViewBooking({
                              ...row,
                              openInvoice: false, // explicitly set
                            })
                          }
                        >
                          👁
                        </Button>
                      </OverlayTrigger>

                      {row.booking_status === "Checked-Out" && (
                        <OverlayTrigger overlay={<Tooltip>View GST Invoice</Tooltip>}>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() =>
                              onViewBooking({
                                ...row,
                                openInvoice: true,
                              })
                            }
                          >
                            🧾
                          </Button>
                        </OverlayTrigger>
                      )}
                    </>
                  )}
                </td>


              </tr>
            ))}

            {/* Show available rooms as well */}
            {availableRooms.map((room, idx) => (
              <tr key={`avail-${idx}`} className="table-success">
                <td>-</td>
                <td>
                  <Badge bg="success">{`${room.room_number} - ${room.room_type}`}</Badge>
                </td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>
                  <span className="badge bg-success">Available</span>
                </td>
                <td>₹0</td>
                <td>₹0</td>
                <td>-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingDashboard;
