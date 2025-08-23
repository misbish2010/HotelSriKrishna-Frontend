import React, { useState } from "react";
import GSTInvoice from "./GSTInvoice";
import { fetchBookingsByDateRange } from "../api";
import html2pdf from "html2pdf.js";

export default function BulkGSTInvoice({ onClose }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate months dynamically (e.g., 2024–2026, adjust as needed)
  const monthOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear ; y <= currentYear ; y++) {
    for (let m = 0; m < 12; m++) {
      monthOptions.push({
        value: `${y}-${m}`, // 2025-7
        label: `${months[m]} ${y}`
      });
    }
  }

  const handleMonthChange = (e) => {
    const [year, monthIndex] = e.target.value.split("-");
    const yearNum = parseInt(year);
    const monthNum = parseInt(monthIndex);

    const firstDay = new Date(Date.UTC(yearNum, monthNum, 1));
    const lastDay  = new Date(Date.UTC(yearNum, monthNum + 1, 0));
    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(lastDay.toISOString().slice(0, 10));
    setSelectedMonth(e.target.value);
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert("Please select a month first");
      return;
    }

    setLoading(true);
    try {
      const payload = { startDate, endDate, rangeType: "monthly" };
      const data = await fetchBookingsByDateRange(payload);
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching bulk invoices:", err);
      alert("Failed to fetch invoices");
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("bulk-invoices");
    const opt = {
      margin: 0.5,
      filename: `GST_Invoices_${startDate}_to_${endDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-3">
      <h4>Generate Bulk GST Invoices</h4>

      {/* Month Selection */}
      <div className="d-flex gap-3 align-items-end mb-3">
        <div>
          <label className="form-label">Select Month</label>
          <select
            className="form-select"
            value={selectedMonth}
            onChange={handleMonthChange}
          >
            <option value="">-- Select Month --</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Start Date</label>
          <input type="date" className="form-control" value={startDate} readOnly />
        </div>
        <div>
          <label className="form-label">End Date</label>
          <input type="date" className="form-control" value={endDate} readOnly />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Render Invoices */}
      {bookings.length > 0 ? (
        <div>
          <div className="mb-3">
            <button className="btn btn-success" onClick={handleDownloadPDF}>
              ⬇️ Download PDF
            </button>
          </div>
          <div id="bulk-invoices">
            {bookings.map((b) => (
              <div key={b.booking_id} style={{ pageBreakAfter: "always" }}>
                <GSTInvoice bookingDetails={b} bookingId={b.booking_id} mode="bulk" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && <p>No invoices generated yet.</p>
      )}
    </div>
  );
}
