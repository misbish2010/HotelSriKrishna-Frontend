import React, { useState } from "react";
import GSTInvoice from "./GSTInvoice";
import { fetchBookingsByDateRange } from "../api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

export default function BulkGSTInvoice({ onClose }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [progress, setProgress]           = useState(0);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const monthOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y <= currentYear; y++) {
    for (let m = 0; m < 12; m++) {
      monthOptions.push({ value: `${y}-${m}`, label: `${months[m]} ${y}` });
    }
  }
  const formatDT = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

  const handleMonthChange = (e) => {
    const [year, monthIndex] = e.target.value.split("-");
    const firstDay = new Date(Date.UTC(year, monthIndex, 1));
    const lastDay  = new Date(Date.UTC(year, Number(monthIndex) + 1, 0));
    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(lastDay.toISOString().slice(0, 10));
    setSelectedMonth(e.target.value);
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) { alert("Please select a month first"); return; }
    setLoading(true);
    try {
      const data = await fetchBookingsByDateRange({ startDate, endDate, rangeType: "monthly" });
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch invoices");
    }
    setLoading(false);
  };

  // ─── PDF Export (unchanged) ───────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (generating) return;
    const nodes = document.querySelectorAll(".bulk-invoice-page");
    if (!nodes.length) { alert("Invoices not ready yet"); return; }

    setGenerating(true);
    setProgress(0);
    await new Promise(r => setTimeout(r, 200));

    const pdf = new jsPDF("p", "in", "a4");
    for (let i = 0; i < nodes.length; i++) {
      const canvas = await html2canvas(nodes[i], { scale: 1.5, useCORS: true, backgroundColor: "#fff" });
      const img = canvas.toDataURL("image/jpeg", 0.9);
      if (i !== 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 8.27, 11.69);
      setProgress(Math.round(((i + 1) / nodes.length) * 100));
      canvas.width = 0; canvas.height = 0;
      await new Promise(r => setTimeout(r, 20));
    }
    pdf.save(`GST_${startDate}_to_${endDate}.pdf`);
    setGenerating(false);
    setProgress(0);
  };

  // ─── Excel Export ─────────────────────────────────────────────────────────
  const handleDownloadExcel = () => {
    if (!bookings.length) { alert("No invoices to export"); return; }

    // ── Build rows ────────────────────────────────────────────────────────
    const rows = bookings.map((b) => {
      const rooms       = b.room_details || [];
      const roomNos     = rooms.map(r => r.room_number).join(", ");
      const roomTypes   = rooms.map(r => r.room_type).join(", ");

      // paid = sum of paid/completed payments (exclude discount/pending)
    const paidAmt = (b.payment_info || [])
      .filter((p) => ["paid", "completed", "refund"].includes((p.status || "").toLowerCase()))
      .reduce((sum, p) => {
        const amount = Number(p.amount || 0);

        if ((p.status|| "").toLowerCase() === "refund") {
          return sum - amount;
        }

        return sum + amount;
      }, 0);
      const totalPrice  = paidAmt || 0;
      const gstRate     = 5;                                      // hotel GST is 5% for <7500
      const taxableAmt  = parseFloat((totalPrice / 1.05).toFixed(2));
      const gstAmt      = parseFloat((totalPrice - taxableAmt).toFixed(2));

      // payment modes (dedupe)
      const modes = [...new Set(
        (b.payment_info || [])
          .filter(p => ["paid", "completed"].includes((p.status || "").toLowerCase()))
          .map(p => (p.mode || "").toUpperCase())
          .filter(Boolean)
      )].join(", ");

      return {
        "Bill No."          : b.gst_info?.gst_bill_no   || "",
        "Bill Date"         : b.gst_info?.gst_bill_date  || "",
        "Guest Name"        : b.customer_info?.name      || "",
        "Phone"             : b.customer_info?.phone     || "",
        "Address"           : b.customer_info?.address   || "",
        "Guest GSTIN"       : b.gst_info?.guest_gst_no   || "",
        "Guest Company"     : b.gst_info?.guest_company_name || "",
        "Room No."          : roomNos,
        "Room Type"         : roomTypes,
        "Check-In"          : b.stay_info?.check_in_date
                                ? formatDT(b.stay_info.check_in_date) : "",
        "Check-Out"         : formatDT(b.stay_info?.probable_check_out_date || b.stay_info?.check_out_date || ""),
        "No. of Days"       : b.stay_info?.duration      || "",
        "Taxable Amt (₹)"   : taxableAmt,
        "GST Rate (%)"      : gstRate,
        "GST Amt (₹)"       : gstAmt,
        "Total Amt (₹)"     : totalPrice,
        "Amount Paid (₹)"   : paidAmt,
        "Payment Mode"      : modes,
      };
    });

    // ── Totals row ────────────────────────────────────────────────────────
    const sum = (key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    const totalsRow = {
      "Bill No."          : "TOTAL",
      "Bill Date"         : "",
      "Guest Name"        : "",
      "Phone"             : "",
      "Address"           : "",
      "Guest GSTIN"       : "",
      "Guest Company"     : "",
      "Room No."          : "",
      "Room Type"         : "",
      "Check-In"          : "",
      "Check-Out"         : "",
      "No. of Days"       : sum("No. of Days"),
      "Taxable Amt (₹)"   : parseFloat(sum("Taxable Amt (₹)").toFixed(2)),
      "GST Rate (%)"      : "",
      "GST Amt (₹)"       : parseFloat(sum("GST Amt (₹)").toFixed(2)),
      "Total Amt (₹)"     : parseFloat(sum("Total Amt (₹)").toFixed(2)),
      "Amount Paid (₹)"   : parseFloat(sum("Amount Paid (₹)").toFixed(2)),
      "Payment Mode"      : "",
    };

    // ── Create workbook ───────────────────────────────────────────────────
    const wb  = XLSX.utils.book_new();

    // Title rows (2 blank rows above headers act as title space)
    const titleRow1 = ["Hotel Sri Krishna — GST Invoice Register"];
    const [yr, mo]  = (startDate || "").split("-");
    const monthName = months[parseInt(mo, 10) - 1] || "";
    const titleRow2 = [`Month: ${monthName} ${yr}   |   GSTIN: 21AHSPM7680F1Z1`];

    const ws = XLSX.utils.aoa_to_sheet([titleRow1, titleRow2, []]);

    // Append data rows + totals
    XLSX.utils.sheet_add_json(ws, [...rows, totalsRow], { origin: "A4", skipHeader: false });

    // Column widths (characters)
    ws["!cols"] = [
      {wch:20},{wch:12},{wch:24},{wch:14},{wch:18},{wch:20},{wch:22},
      {wch:10},{wch:20},{wch:14},{wch:14},{wch:10},
      {wch:16},{wch:12},{wch:14},{wch:14},{wch:16},{wch:14},{wch:16},
    ];

    // Merge title cells across all 19 columns
    ws["!merges"] = [
      { s: { r:0, c:0 }, e: { r:0, c:18 } },
      { s: { r:1, c:0 }, e: { r:1, c:18 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "GST Register");

    const [y, m] = (startDate || "2026-01").split("-");
    XLSX.writeFile(wb, `GST_Register_${months[parseInt(m,10)-1]}_${y}.xlsx`);
  };

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-3">
      <h4>Generate Bulk GST Invoices</h4>

      <div className="d-flex gap-3 align-items-end mb-3 flex-wrap">
        <div>
          <label>Select Month</label>
          <select className="form-select" value={selectedMonth} onChange={handleMonthChange}>
            <option value="">-- Select Month --</option>
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
          <>
            <button
              className="btn btn-danger"
              onClick={handleDownloadPDF}
              disabled={generating}
              title="Download all invoices as one PDF"
            >
              {generating ? `Generating… ${progress}%` : "⬇️ Download PDF"}
            </button>

            <button
              className="btn btn-success"
              onClick={handleDownloadExcel}
              title="Download summary as Excel for CA"
            >
              📊 Download Excel (CA)
            </button>
          </>
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
          <div className="text-muted mt-1">Generating invoices… {progress}%</div>
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
