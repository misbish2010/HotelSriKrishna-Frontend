import React, { useState } from "react";
import GSTInvoice from "./GSTInvoice";
import { fetchBookingsByDateRange } from "../api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function BulkGSTInvoice({ onClose }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const monthOptions = [];
  const currentYear = new Date().getFullYear();

  for (let y = currentYear; y <= currentYear; y++) {
    for (let m = 0; m < 12; m++) {
      monthOptions.push({
        value: `${y}-${m}`,
        label: `${months[m]} ${y}`
      });
    }
  }

  const handleMonthChange = (e) => {
    const [year, monthIndex] = e.target.value.split("-");
    const firstDay = new Date(Date.UTC(year, monthIndex, 1));
    const lastDay = new Date(Date.UTC(year, Number(monthIndex) + 1, 0));

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
      console.error(err);
      alert("Failed to fetch invoices");
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (generating) return;

    const nodes = document.querySelectorAll(".bulk-invoice-page");
    if (!nodes.length) {
      alert("Invoices not ready yet");
      return;
    }

    setGenerating(true);
    setProgress(0);

    // let browser paint UI before heavy work
    await new Promise(r => setTimeout(r, 200));

    const pdf = new jsPDF("p", "in", "a4");

    for (let i = 0; i < nodes.length; i++) {
      const canvas = await html2canvas(nodes[i], {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#fff"
      });

      const img = canvas.toDataURL("image/jpeg", 0.9);

      if (i !== 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 8.27, 11.69);

      const percent = Math.round(((i + 1) / nodes.length) * 100);
      setProgress(percent);

      canvas.width = 0;
      canvas.height = 0;

      await new Promise(r => setTimeout(r, 20));
    }

    pdf.save(`GST_${startDate}_to_${endDate}.pdf`);

    setGenerating(false);
    setProgress(0);
  };

  return (
    <div className="p-3">
      <h4>Generate Bulk GST Invoices</h4>

      <div className="d-flex gap-3 align-items-end mb-3">
        <div>
          <label>Select Month</label>
          <select
            className="form-select"
            value={selectedMonth}
            onChange={handleMonthChange}
          >
            <option value="">-- Select Month --</option>
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Start Date</label>
          <input type="date" className="form-control" value={startDate} readOnly />
        </div>

        <div>
          <label>End Date</label>
          <input type="date" className="form-control" value={endDate} readOnly />
        </div>

        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </button>

        {bookings.length > 0 && (
          <button
            className="btn btn-success"
            onClick={handleDownloadPDF}
            disabled={generating}
          >
            {generating ? "Generating..." : "⬇️ Download PDF"}
          </button>
        )}
      </div>

      {generating && (
        <div className="mb-3">
          <div className="progress">
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
          <div className="text-muted mt-1">
            Generating invoices… {progress}%
          </div>
        </div>
      )}

      {bookings.length > 0 ? (
        <div id="bulk-invoices">
          {bookings.map(b => (
            <div key={b.booking_id} className="bulk-invoice-page" style={{ pageBreakAfter: "always" }}>
              <GSTInvoice bookingDetails={b} bookingId={b.booking_id} mode="bulk" />
            </div>
          ))}
        </div>
      ) : (
        !loading && <p>No invoices generated yet.</p>
      )}
    </div>
  );
}
