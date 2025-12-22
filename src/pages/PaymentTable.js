import "./RoomTable.css";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchPaymentDetails } from "../api";
import { format } from "date-fns";
import { FaMoneyBillWave, FaMobileAlt, FaUndo, FaClock, FaChartLine, FaReceipt } from "react-icons/fa";

const PaymentTable = () => {
  const [paymentTableData, setPaymentTableData] = useState([]);
  const [expenseTableData, setExpenseTableData] = useState([]);
  const [pendingPaymentTableData, setPendingPaymentTableData] = useState([]);
  const [advanceAdjustedTableData, setAdvanceAdjustedTableData] = useState([]);

  const [filteredPaymentData, setFilteredPaymentData] = useState([]);

  const [selectedFromDate, setSelectedFromDate] = useState(new Date());
  const [selectedToDate, setSelectedToDate] = useState(new Date());
  const [validationError, setValidationError] = useState("");

  const [totalCashCollected, setTotalCashCollected] = useState(0);
  const [totalUPICollected, setTotalUPICollected] = useState(0);
  const [totalCashRefunded, setTotalCashRefunded] = useState(0);
  const [totalUPIRefunded, setTotalUPIRefunded] = useState(0);
  const [totalCollection, setTotalCollection] = useState(0);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  const [paymentModeFilter, setPaymentModeFilter] = useState({ CASH: true, UPI: true });
  const [bookingStatusFilter, setBookingStatusFilter] = useState({
    Confirmed: true,
    "Checked-In": true,
    "Checked-Out": true,
    Cancelled: true,
  });

  const [activeTab, setActiveTab] = useState("paid");

  const formatDate = (date) => format(date, "dd MMM yyyy");
  const formatExpenseDate = (date) => format(new Date(date), "dd MMM yyyy");

  const quickRanges = {
    today: () => {
      const now = new Date();
      setSelectedFromDate(now);
      setSelectedToDate(now);
    },
    last7: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      setSelectedFromDate(from);
      setSelectedToDate(to);
    },
    month: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      setSelectedFromDate(from);
      setSelectedToDate(now);
    },
  };

  const handleFromDateChange = (date) => {
    if (date > selectedToDate) {
      setValidationError("From Date cannot be after To Date");
      return;
    }
    setValidationError("");
    setSelectedFromDate(date);
  };

  const handleToDateChange = (date) => {
    if (date < selectedFromDate) {
      setValidationError("To Date cannot be before From Date");
      return;
    }
    setValidationError("");
    setSelectedToDate(date);
  };

  const handlePaymentModeChange = (mode) => {
    setPaymentModeFilter((prev) => ({ ...prev, [mode]: !prev[mode] }));
  };

  const handleBookingStatusChange = (status) => {
    setBookingStatusFilter((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const fetchAndProcessPayments = async () => {
    try {
      const data = await fetchPaymentDetails(selectedFromDate, selectedToDate);

      const {
        payment_details,
        pending_payment_details,
        expense_details,
        adjusted_payment_details,
      } = data;
      console.log(payment_details)
      console.log(adjusted_payment_details)
      console.log(data);

      let cashCollected = 0,
        upiCollected = 0,
        cashRefunded = 0,
        upiRefunded = 0,
        pendingAmount = 0,
        expenseAmount = 0;

      payment_details.forEach((payment) => {
        if (payment.payment_mode === "CASH") {
          payment.amount > 0
            ? (cashCollected += payment.amount)
            : (cashRefunded += Math.abs(payment.amount));
        } else if (payment.payment_mode === "UPI") {
          payment.amount > 0
            ? (upiCollected += payment.amount)
            : (upiRefunded += Math.abs(payment.amount));
        }
      });

      pending_payment_details.forEach((p) => (pendingAmount += p.amount));
      expense_details.forEach((e) => (expenseAmount += e.amount));

      setTotalCashCollected(cashCollected);
      setTotalUPICollected(upiCollected);
      setTotalCashRefunded(cashRefunded);
      setTotalUPIRefunded(upiRefunded);
      setTotalCollection(cashCollected + upiCollected - cashRefunded - upiRefunded);
      setTotalExpenditure(expenseAmount);

      setExpenseTableData(expense_details);
      setPaymentTableData(payment_details);
      setPendingPaymentTableData(pending_payment_details);
      setTotalPending(pendingAmount);

      // NEW - advance adjusted
      setAdvanceAdjustedTableData(adjusted_payment_details || []);
      console.log(advanceAdjustedTableData)
      console.log(paymentTableData)
    } catch (error) {
      console.error("Error processing payment data:", error);
    }
  };

  useEffect(() => {
    fetchAndProcessPayments();
  }, [selectedFromDate, selectedToDate]);

  useEffect(() => {
    setFilteredPaymentData(
      paymentTableData.filter(
        (p) =>
          ((paymentModeFilter.CASH && p.payment_mode === "CASH") ||
            (paymentModeFilter.UPI && p.payment_mode === "UPI")) &&
          bookingStatusFilter[p.booking_status]
      )
    );
  }, [paymentTableData, paymentModeFilter, bookingStatusFilter]);

  const StatCard = ({ icon, label, value, color }) => (
    <div
      style={{
        flex: 1,
        backgroundColor: color,
        color: "#fff",
        padding: "10px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: "14px" }}>{label}</div>
        <div style={{ fontWeight: "bold", fontSize: "16px" }}>₹{value.toFixed(2)}</div>
      </div>
    </div>
  );

  const renderTable = (data, type) => (
    <div style={{ overflowX: "auto" }}>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>#</th>

            {/* COMMON COLUMNS */}
            {type !== "expense" && <th>Room</th>}
            {type !== "expense" && <th>Booking ID</th>}
            {type !== "expense" && <th>Booking Status</th>}
            {type !== "expense" && <th>Customer</th>}
            {type !== "expense" && <th>Contact</th>}

            {/* PAID TAB */}
            {type === "paid" && <th>Mode</th>}
            {type === "paid" && <th style={{ textAlign: "right" }}>Credited</th>}
            {type === "paid" && <th style={{ textAlign: "right" }}>Refunded</th>}
            {type === "paid" && <th>Payment Date</th>}
            {type === "paid" && <th>Check In Date</th>}

            {/* PENDING TAB */}
            {type === "pending" && <th style={{ textAlign: "right" }}>Price Per Night</th>}
            {type === "pending" && <th style={{ textAlign: "right" }}>Advanced</th>}
            {type === "pending" && <th style={{ textAlign: "right" }}>Pending</th>}

            {/* EXPENSE TAB */}
            {type === "expense" && <th>Description</th>}
            {type === "expense" && <th style={{ textAlign: "right" }}>Amount</th>}
            {type === "expense" && <th>Mode</th>}
            {type === "expense" && <th>Date</th>}

            {/* ADVANCE ADJUSTED */}
            {type === "advance" && <th>Total Advance</th>}
            {type === "advance" && <th>Advance Paid Dates</th>}
            {type === "advance" && <th>Adjusted On</th>}
            {type === "advance" && <th>Check-In Date</th>}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((payment, index) => (
              <tr key={index}>
                <td>{index + 1}</td>

                {type !== "expense" && (
                  <td>
                    {Array.isArray(payment.room_numbers)
                      ? payment.room_numbers.join(", ")
                      : payment.room_numbers}
                  </td>
                )}

                {type !== "expense" && <td>{payment.booking_id}</td>}
                {type !== "expense" && <td>{payment.booking_status}</td>}
                {type !== "expense" && <td>{payment.customer_name}</td>}
                {type !== "expense" && <td>{payment.contact_number}</td>}

                {type === "paid" && <td>{payment.payment_mode}</td>}

                {type === "paid" && (
                  <td style={{ textAlign: "right" }}>
                    {payment.amount > 0 ? `₹${payment.amount.toFixed(2)}` : "-"}
                  </td>
                )}

                {type === "paid" && (
                  <td style={{ textAlign: "right" }}>
                    {payment.amount < 0 ? `₹${Math.abs(payment.amount).toFixed(2)}` : "-"}
                  </td>
                )}

                {type === "paid" && <td>{formatDate(payment.payment_date)}</td>}
                {type === "paid" && <td>{formatDate(payment.check_in_date)}</td>}

                {/* PENDING */}
                {type === "pending" && (
                  <>
                    <td style={{ textAlign: "right" }}>
                      ₹{Number(payment.agreed_price_per_night || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      ₹{Number(payment.advance_paid || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      ₹{Number(payment.net_pending_amount || 0).toFixed(2)}
                    </td>
                  </>
                )}




                {/* EXPENSE */}
                {type === "expense" && <td>{payment.description}</td>}
                {type === "expense" && (
                  <td style={{ textAlign: "right" }}>{payment.amount}</td>
                )}
                {type === "expense" && <td>{payment.mode}</td>}
                {type === "expense" && (
                  <td>{formatExpenseDate(payment.date)}</td>
                )}

                {/* ADVANCE ADJUSTED TAB */}
                {type === "advance" && <td>₹{payment.total_advance}</td>}

                {type === "advance" && (
                  <td>
                    {payment.advance_paid_dates && payment.advance_paid_dates.length > 0
                      ? payment.advance_paid_dates.map((d, idx) => (
                          <div key={idx}>{formatDate(new Date(d))}</div>
                        ))
                      : "-"}
                  </td>
                )}

                {type === "advance" && <td>{formatDate(payment.adjusted_on)}</td>}
                {type === "advance" && (
                  <td>{formatDate(new Date(payment.check_in_date))}</td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" style={{ textAlign: "center" }}>
                No {type} records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Payment Dashboard</h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
          background: "#f9f9f9",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      >
        <div>
          <label>From: </label>
          <DatePicker
            selected={selectedFromDate}
            onChange={handleFromDateChange}
            dateFormat="dd/MM/yyyy"
          />
        </div>
        <div>
          <label>To: </label>
          <DatePicker
            selected={selectedToDate}
            onChange={handleToDateChange}
            dateFormat="dd/MM/yyyy"
          />
        </div>

        {/* Payment Mode */}
        <div>
          <label>Payment Mode:</label>
          <input
            type="checkbox"
            checked={paymentModeFilter.CASH}
            onChange={() => handlePaymentModeChange("CASH")}
          />{" "}
          Cash
          <input
            type="checkbox"
            checked={paymentModeFilter.UPI}
            onChange={() => handlePaymentModeChange("UPI")}
          />{" "}
          UPI
        </div>

        {/* Booking Status */}
        <div>
          <label>Booking Status:</label>
          {Object.keys(bookingStatusFilter).map((status) => (
            <span key={status} style={{ marginRight: "5px" }}>
              <input
                type="checkbox"
                checked={bookingStatusFilter[status]}
                onChange={() => handleBookingStatusChange(status)}
              />{" "}
              {status}
            </span>
          ))}
        </div>

        <div>
          <button onClick={quickRanges.today} className="btn btn-sm btn-light">
            Today
          </button>
          <button onClick={quickRanges.last7} className="btn btn-sm btn-light">
            Last 7 Days
          </button>
          <button onClick={quickRanges.month} className="btn btn-sm btn-light">
            This Month
          </button>
        </div>
      </div>

      {validationError && (
        <div style={{ color: "red", marginBottom: "10px" }}>{validationError}</div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <StatCard icon={<FaMoneyBillWave />} label="Cash Collected" value={totalCashCollected} color="#28a745" />
        <StatCard icon={<FaMobileAlt />} label="UPI Collected" value={totalUPICollected} color="#17a2b8" />
        <StatCard icon={<FaUndo />} label="Cash Refunded" value={totalCashRefunded} color="#ffc107" />
        <StatCard icon={<FaUndo />} label="UPI Refunded" value={totalUPIRefunded} color="#fd7e14" />
        <StatCard icon={<FaChartLine />} label="Net Collection" value={totalCollection} color="#007bff" />
        <StatCard icon={<FaClock />} label="Pending" value={totalPending} color="#6f42c1" />
        <StatCard icon={<FaReceipt />} label="Expenditure" value={totalExpenditure} color="#dc3545" />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "15px" }}>
        <button className={activeTab === "paid" ? "active" : ""} onClick={() => setActiveTab("paid")}>
          💰 Paid
        </button>
        <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
          🕒 Pending
        </button>
        <button className={activeTab === "expense" ? "active" : ""} onClick={() => setActiveTab("expense")}>
          📉 Expenditure
        </button>

        {/* NEW TAB */}
        <button className={activeTab === "advance" ? "active" : ""} onClick={() => setActiveTab("advance")}>
          🟡 Advance Adjusted
        </button>
      </div>

      {/* TABLES */}
      {activeTab === "paid" && renderTable(filteredPaymentData, "paid")}
      {activeTab === "pending" && renderTable(pendingPaymentTableData, "pending")}
      {activeTab === "expense" && renderTable(expenseTableData, "expense")}
      {activeTab === "advance" && renderTable(advanceAdjustedTableData, "advance")}
    </div>
  );
};

export default PaymentTable;
