import './RoomTable.css';
import { Button, Tooltip, OverlayTrigger, Badge, Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from "date-fns";
import { fetchBookingDashboard } from '../api';

const STATUS_OPTIONS = [
  "Available",
  "Confirmed",
  "Checked-In",
  "Checked-Out",
  "Cancelled"
];

const BookingDashboard = ({ onViewBooking }) => {
  const [bookingTableData, setBookingTableData] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  const [selectedStatuses, setSelectedStatuses] = useState([...STATUS_OPTIONS]);
  const [paymentFilter, setPaymentFilter] = useState("ALL"); // ALL, PAID, BALANCE
  const [paymentModeFilter, setPaymentModeFilter] = useState("ALL");   // ALL | CASH | UPI | BOTH


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

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const selectAllStatuses = () => setSelectedStatuses([...STATUS_OPTIONS]);
  const clearAllStatuses = () => setSelectedStatuses([]);

  const fetchRoomData = async () => {
    try {
      const data = await fetchBookingDashboard(selectedFromDate, selectedToDate);
      console.log(data)

      const transformedBookings = (data.bookings || []).map((b) => {
        const paidAmount = (b.payment_info || [])
          .filter((p) => ["completed", "paid", "refund"].includes((p.status || "").toLowerCase()))
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const paymentModes = new Set(
          (b.payment_info || [])
            .filter(p => ["completed", "paid"].includes((p.status || "").toLowerCase()))
            .map(p => (p.mode || "").toLowerCase())
        );

        let paymentMode = "NONE";
        if (paymentModes.has("cash") && paymentModes.has("upi")) paymentMode = "BOTH";
        else if (paymentModes.has("cash")) paymentMode = "CASH";
        else if (paymentModes.has("upi")) paymentMode = "UPI";

        const totalPrice = b.total_price || 0;
        const balance = Math.max(totalPrice - paidAmount, 0);

        return {
          ...b,
          paidAmount,
          totalPrice,
          balance,
          rooms: (b.room_details || []).map((r, idx) => (
            <Badge key={idx} bg="info" className="me-1">
              {`${r.room_number} - ${r.is_ac ? "AC " : ""}${r.occupancy} ${r.room_type}`}
            </Badge>
          )),
          checkInDate: formatDate(b.stay_info?.check_in_date),
          probableCheckOutDate: formatDate(b.stay_info?.probable_check_out_date),
          durationOfStay: b.stay_info?.duration || "-",
          paymentMode
        };
      });

      setBookingTableData(transformedBookings);
      setAvailableRooms(data.available_rooms || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [selectedFromDate, selectedToDate]);

  const filteredTableData = bookingTableData.filter((row) => {
    const statusMatch = selectedStatuses.includes(row.booking_status);

    const paidMatch =
      paymentFilter === "ALL" ||
      (paymentFilter === "PAID" && row.balance <= 0) ||
      (paymentFilter === "BALANCE" && row.balance > 0);
    const paymentModeMatch =
        paymentModeFilter === "ALL" ||
        row.paymentMode === paymentModeFilter;

    return statusMatch && paidMatch && paymentModeMatch;
  });

  return (
    <div className="room-grid-container p-4">

      {/* Filters Row */}
      <div className="controls-row mb-3 d-flex gap-3 flex-wrap align-items-center">

        {/* Date Filters */}
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

        {/* Status Filter */}
        <Dropdown>
          <Dropdown.Toggle variant="secondary" size="sm">
            Status Filter
          </Dropdown.Toggle>

          <Dropdown.Menu style={{ padding: "10px", minWidth: "200px" }}>
            <div className="d-flex justify-content-between mb-2">
              <Button size="sm" variant="outline-primary" onClick={selectAllStatuses}>
                Select All
              </Button>
              <Button size="sm" variant="outline-danger" onClick={clearAllStatuses}>
                Clear
              </Button>
            </div>

            {STATUS_OPTIONS.map((status) => (
              <div key={status} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                <label className="form-check-label">{status}</label>
              </div>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        {/* Payment Filter */}
        <div className="btn-group" role="group" aria-label="Payment Filter">
          <Button
            size="sm"
            variant={paymentFilter === "ALL" ? "primary" : "outline-primary"}
            onClick={() => setPaymentFilter("ALL")}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={paymentFilter === "PAID" ? "primary" : "outline-primary"}
            onClick={() => setPaymentFilter("PAID")}
          >
            Paid
          </Button>
          <Button
            size="sm"
            variant={paymentFilter === "BALANCE" ? "primary" : "outline-primary"}
            onClick={() => setPaymentFilter("BALANCE")}
          >
            Balance
          </Button>
        </div>

        <div className="btn-group" role="group" aria-label="Payment Mode Filter">
          <Button
            size="sm"
            variant={paymentModeFilter === "ALL" ? "primary" : "outline-primary"}
            onClick={() => setPaymentModeFilter("ALL")}
          >
            All Modes
          </Button>
          <Button
            size="sm"
            variant={paymentModeFilter === "CASH" ? "primary" : "outline-primary"}
            onClick={() => setPaymentModeFilter("CASH")}
          >
            Cash
          </Button>
          <Button
            size="sm"
            variant={paymentModeFilter === "UPI" ? "primary" : "outline-primary"}
            onClick={() => setPaymentModeFilter("UPI")}
          >
            UPI
          </Button>
          <Button
            size="sm"
            variant={paymentModeFilter === "BOTH" ? "primary" : "outline-primary"}
            onClick={() => setPaymentModeFilter("BOTH")}
          >
            Both
          </Button>
        </div>


      </div>

      {/* Table */}
      <div className="table-container bg-white p-3 rounded shadow-sm">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-primary">
            <tr>
              <th>Booking ID</th>
              <th>Room(s)</th>
              <th>Guest</th>
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
            {filteredTableData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.booking_id}</td>
                <td>{row.rooms}</td>
                <td>{row.customer_info?.name}</td>
                <td>{row.checkInDate}</td>
                <td>{row.probableCheckOutDate}</td>
                <td>{row.durationOfStay}</td>

                <td>
                  <span className={`badge ${
                    row.booking_status === "Available" ? "bg-success" :
                    row.booking_status === "Confirmed" ? "bg-primary" :
                    row.booking_status === "Checked-Out" ? "bg-secondary" :
                    "bg-danger"
                  }`}>
                    {row.booking_status}
                  </span>
                </td>

                <td>₹{row.paidAmount}</td>
                <td>₹{row.balance}</td>

                <td>
                  {row.booking_status !== "Available" && (
                    <>
                      <OverlayTrigger overlay={<Tooltip>View / Manage</Tooltip>}>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() =>
                            onViewBooking({ ...row, openInvoice: false })
                          }
                        >
                          👁
                        </Button>
                      </OverlayTrigger>

                      {row.booking_status === "Checked-Out" && (
                        <OverlayTrigger overlay={<Tooltip>
                                                         {row.gst_info?.gst_bill_no
                                                           ? `Bill Generated: ${row.gst_info.gst_bill_no}`
                                                           : "Bill Not Generated"}
                                                       </Tooltip>}>
                          <Button
                            variant={row.gst_info?.gst_bill_no ? "success" : "warning"}
                            size="sm"
                            onClick={() =>
                              onViewBooking({ ...row, openInvoice: true })
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

            {/* Available Rooms */}
            {selectedStatuses.includes("Available") &&
              paymentFilter !== "BALANCE" &&
              availableRooms.map((room, idx) => (
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
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingDashboard;
