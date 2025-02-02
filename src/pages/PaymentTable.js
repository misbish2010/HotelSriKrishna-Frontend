import "./RoomTable.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchPaymentDetails } from "../api";
import { format } from "date-fns";

const PaymentTable = () => {
  const [paymentTableData, setPaymentTableData] = useState([]);
  const [expenseTableData, setExpenseTableData] = useState([]);
  const [pendingPaymentTableData, setPendingPaymentTableData] = useState([]);
  const [filteredPaymentData, setFilteredPaymentData] = useState([]);
  const [selectedFromDate, setSelectedFromDate] = useState(new Date());
  const [selectedToDate, setSelectedToDate] = useState(new Date());
  const [totalCashCollected, setTotalCashCollected] = useState(0);
  const [totalUPICollected, setTotalUPICollected] = useState(0);
  const [totalCashRefunded, setTotalCashRefunded] = useState(0);
  const [totalUPIRefunded, setTotalUPIRefunded] = useState(0);
  const [totalCollection, setTotalCollection] = useState(0);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [paymentModeFilter, setPaymentModeFilter] = useState({
    CASH: true,
    UPI: true,
  });
  const [activeTab, setActiveTab] = useState("paid"); // Tabs: 'paid' or 'pending'

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

  const handlePaymentModeChange = (mode) => {
    setPaymentModeFilter((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  const fetchAndProcessPayments = async () => {
    try {
      const data = await fetchPaymentDetails(selectedFromDate, selectedToDate);
      const paymentDetails = data.payment_details;
      const pendingPaymentDetails = data.pending_payment_details;
      const expenseDetails = data.expense_details
      console.log(data)
      let cashCollected = 0;
      let upiCollected = 0;
      let cashRefunded = 0;
      let upiRefunded = 0;
      let pendingAmount = 0;
      let expenseAmount = 0;

      paymentDetails.forEach((payment) => {
        if (payment.payment_mode === "CASH") {
          if (payment.amount > 0) {
            cashCollected += payment.amount;
          } else {
            cashRefunded += Math.abs(payment.amount);
          }
        } else if (payment.payment_mode === "UPI") {
          if (payment.amount > 0) {
            upiCollected += payment.amount;
          } else {
            upiRefunded += Math.abs(payment.amount);
          }
        }
      });

      pendingPaymentDetails.forEach((payment) => {
        pendingAmount += payment.amount;
      });

      expenseDetails.forEach((expense) => {
        expenseAmount += expense.amount;
      });

      setTotalCashCollected(cashCollected);
      setTotalUPICollected(upiCollected);
      setTotalCashRefunded(cashRefunded);
      setTotalUPIRefunded(upiRefunded);
      setTotalCollection(
        cashCollected + upiCollected - cashRefunded - upiRefunded
      );
      setTotalExpenditure(expenseAmount)
      setExpenseTableData(expenseDetails)
      setPaymentTableData(paymentDetails);
      setPendingPaymentTableData(pendingPaymentDetails);
      setTotalPending(pendingAmount);
    } catch (error) {
      console.error("Error processing payment data:", error);
    }
  };

  useEffect(() => {
    fetchAndProcessPayments();
  }, [selectedFromDate, selectedToDate]);

  useEffect(() => {
    const filteredData = paymentTableData.filter(
      (payment) =>
        (paymentModeFilter.CASH && payment.payment_mode === "CASH") ||
        (paymentModeFilter.UPI && payment.payment_mode === "UPI")
    );
    setFilteredPaymentData(filteredData);
  }, [paymentTableData, paymentModeFilter]);

  const renderTable = (data, type) => (
    <table className="table table-bordered">
      <thead>
        <tr>
          <th>#</th>
          {type != "expense" && <th>Room Number</th>}
          {type != "expense" && <th>Booking ID</th>}
          {type != "expense" && <th>Customer Name</th>}
          {type != "expense" && <th>Contact Number</th>}
          {type === "paid" && <th>Payment Mode</th>}
          {type === "paid" && <th>Amount Credited</th>}
          {type === "paid" && <th>Amount Refunded</th>}
          {type === "paid" && <th>Payment Date</th>}
          {type === "pending" && <th>Amount Pending</th>}
          {type === "expense" && <th>Description</th>}
          {type === "expense" && <th>Amount</th>}
          {type === "expense" && <th>Mode</th>}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((payment, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              {type != "expense" && <td>
                {Array.isArray(payment.room_numbers)
                  ? payment.room_numbers.join(", ")
                  : payment.room_numbers}
              </td> }
              {type != "expense" && <td>{payment.booking_id}</td>}
              {type != "expense" && <td>{payment.customer_name}</td>}
              {type != "expense" && <td>{payment.contact_number}</td>}

              {type === "paid" && <td>{payment.payment_mode}</td>}
              {type === "paid" && (
                <td>
                  {payment.amount > 0
                    ? `₹${payment.amount.toFixed(2)}`
                    : "-"}
                </td>
              )}
              {type === "paid" && (
                <td>
                  {payment.amount < 0
                    ? `₹${Math.abs(payment.amount).toFixed(2)}`
                    : "-"}
                </td>
              )}
              {type === "paid" && <td>{formatDate(payment.payment_date)}</td>}
              {type === "pending" && (
                <td>₹{payment.amount.toFixed(2)}</td>
              )}

              {type === "expense" && <td>{payment.description}</td>}
              {type === "expense" && <td>{payment.amount}</td>}
              {type === "expense" && <td>{payment.mode}</td>}
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={type === "paid" ? 9 : 6}
              style={{ textAlign: "center" }}
            >
              No {type} payment available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Payment Details</h2>
      {/* Date and Payment Mode Filters */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="fromDate">From Date:</label>
          <DatePicker
            selected={selectedFromDate}
            onChange={handleFromDateChange}
            dateFormat="dd/MM/yyyy"
            id="fromDate"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="toDate">To Date:</label>
          <DatePicker
            selected={selectedToDate}
            onChange={handleToDateChange}
            dateFormat="dd/MM/yyyy"
            id="toDate"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label htmlFor="paymentMode">Payment Mode:</label>
          <div>
            <input
              type="checkbox"
              id="cash"
              checked={paymentModeFilter.CASH}
              onChange={() => handlePaymentModeChange("CASH")}
            />
            <label htmlFor="cash">Cash</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="upi"
              checked={paymentModeFilter.UPI}
              onChange={() => handlePaymentModeChange("UPI")}
            />
            <label htmlFor="upi">UPI</label>
          </div>
        </div>
      </div>
      {/* Summary Section */}
      <div style={{ marginBottom: "20px", backgroundColor: "#f7f7f7", padding: "10px", borderRadius: "5px" }}>
        <h4>Summary</h4>
        <p>Total Cash Collected: ₹{totalCashCollected.toFixed(2)}</p>
        <p>Total UPI Collected: ₹{totalUPICollected.toFixed(2)}</p>
        <p>Total Cash Refunded: ₹{totalCashRefunded.toFixed(2)}</p>
        <p>Total UPI Refunded: ₹{totalUPIRefunded.toFixed(2)}</p>
        <p>
          <strong>Total Collection: ₹{totalCollection.toFixed(2)}</strong>
        </p>
        <p>
          <strong>Total Pending: ₹{totalPending.toFixed(2)}</strong>
        </p>
        <p>
          <strong>Total Expenditure: ₹{totalExpenditure.toFixed(2)}</strong>
        </p>
      </div>
      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "paid" ? "active" : ""}
          onClick={() => setActiveTab("paid")}
        >
          Paid Payments
        </button>
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          Pending Payments
        </button>
        <button
          className={activeTab === "expense" ? "active" : ""}
          onClick={() => setActiveTab("expense")}
        >
          Expenditure
        </button>
      </div>
      {/* Active Tab Content */}
      <div style={{ marginTop: "20px" }}>
        {activeTab === "paid" ? renderTable(filteredPaymentData, "paid") : null}
        {activeTab === "pending"
          ? renderTable(pendingPaymentTableData, "pending")
          : null}
        {activeTab === "expense"
          ? renderTable(expenseTableData, "expense")
          : null}
      </div>
    </div>
  );
};

export default PaymentTable;
