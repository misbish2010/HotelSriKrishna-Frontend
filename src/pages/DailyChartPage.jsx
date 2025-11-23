// File: src/components/DailyChartPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchDailyChart } from "../api"; // adjust path if needed
import StatusBadge from "./StatusBadge.jsx"

// const STATUS_META = {
//   available: { label: "Available", badgeClass: "bg-success" },
//   checked_in: { label: "Checked-In", badgeClass: "bg-danger" },
//   new_booking: { label: "New Booking", badgeClass: "bg-primary" },
//   continue_checked_in: { label: "Continue (Checked-In)", badgeClass: "bg-warning text-dark" },
//   continue_confirmed: { label: "Continue (Confirmed)", badgeClass: "bg-warning text-dark" },
//   checkout_to_new_booking: { label: "Checkout → New Booking", badgeClass: "bg-danger" },
//   checkout_available: { label: "Checkout → Available", badgeClass: "bg-secondary", inlineStyle: { background: "#fd7e14", color: "#000" } },
//   unknown: { label: "Unknown", badgeClass: "bg-orange" }
// };

const showNamePhone = (name, phone) => {
  if (!name && !phone) return "—";
  if (!name) return `(${formatPhone(phone)})`;
  if (!phone) return name;
  return `${name} (${formatPhone(phone)})`;
};
// function StatusBadge({ status }) {
//   const meta = STATUS_META[status] || STATUS_META.unknown;
//   const cls = `badge ${meta.badgeClass}`;
//   return <span className={cls} style={meta.inlineStyle || {}}>{meta.label}</span>;
// }

function formatPhone(p) {
  if (!p) return "—";
  return p;
}

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => {
      const val = r[h] === null || r[h] === undefined ? "" : String(r[h]);
      if (val.includes(",") || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DailyChartPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [date]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyChart(date);
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message || "Failed to fetch");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredRooms = useMemo(() => {
    let out = rooms.slice();
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(r =>
        (r.room_number && String(r.room_number).toLowerCase().includes(q)) ||
        (r.guest_name && r.guest_name.toLowerCase().includes(q)) ||
        (r.current_guest_name && r.current_guest_name.toLowerCase().includes(q)) ||
        (r.next_guest_name && r.next_guest_name.toLowerCase().includes(q)) ||
        (r.phone && String(r.phone).toLowerCase().includes(q)) ||
        (r.current_guest_phone && String(r.current_guest_phone).toLowerCase().includes(q)) ||
        (r.next_guest_phone && String(r.next_guest_phone).toLowerCase().includes(q))
      );
    }
    out.sort((a, b) => {
      const an = parseInt(String(a.room_number).replace(/\D/g, ""), 10);
      const bn = parseInt(String(b.room_number).replace(/\D/g, ""), 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return String(a.room_number).localeCompare(String(b.room_number));
    });
    return out;
  }, [rooms, statusFilter, search]);

  function exportVisibleCSV() {
    const rows = filteredRooms.map(r => ({
      room_number: r.room_number,
      status: r.status,
      guest_name: r.guest_name || r.current_guest_name || r.next_guest_name || "",
      phone: r.phone || r.current_guest_phone || r.next_guest_phone || ""
    }));
    const filename = `daily-chart-${date}.csv`;
    downloadCSV(filename, rows);
  }

  function printView() {
    window.print();
  }

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 className="mb-0">Daily Chart</h3>
          <small className="text-muted">Date: {date}</small>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={e => setDate(e.target.value)}
            aria-label="Select date"
          />
          <button className="btn btn-outline-secondary" onClick={fetchData} disabled={loading}>
            Refresh
          </button>
{/*           <div className="btn-group" role="group" aria-label="export-print"> */}
{/*             <button className="btn btn-outline-primary" onClick={exportVisibleCSV}>Export CSV</button> */}
{/*             <button className="btn btn-outline-secondary" onClick={printView}>Print</button> */}
{/*           </div> */}
        </div>
      </div>

      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
        <div className="me-2">
          <label className="form-label mb-0 me-2"><strong>Filter:</strong></label>
          <select className="form-select d-inline-block" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 220 }}>
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="checked_in">Checked-In</option>
            <option value="new_booking">New Booking</option>
            <option value="continue_checked_in">Continue (Checked-In)</option>
            <option value="continue_confirmed">Continue (Confirmed)</option>
            <option value="checkout_available">Checkout → Available</option>
            <option value="checkout_to_new_booking">Checkout → New Booking</option>
          </select>
        </div>

        <div className="ms-auto" style={{ minWidth: 220 }}>
          <input
            className="form-control"
            placeholder="Search room / guest / phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-2">
        <small>
          <strong>Legend:</strong>
          {" "}
          <span className="ms-2"><StatusBadge status="available" /></span>
          <span className="ms-2"><StatusBadge status="checked_in" /></span>
          <span className="ms-2"><StatusBadge status="new_booking" /></span>
          <span className="ms-2"><StatusBadge status="continue_checked_in" /></span>
          <span className="ms-2"><StatusBadge status="continue_confirmed" /></span>
          <span className="ms-2"><StatusBadge status="checkout" /></span>
{/*           <span className="ms-2"><StatusBadge status="checkout_available" /></span> */}
{/*           <span className="ms-2"><StatusBadge status="checkout_to_new_booking" /></span> */}
        </small>
      </div>

      {loading && <div className="alert alert-info">Loading…</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Desktop table */}
      <div className="table-responsive d-none d-md-block">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Room No</th>
              <th style={{ width: 240 }}>Status</th>
              <th>Guest (current / next)</th>
{/*               <th style={{ width: 180 }}>Phone</th> */}
{/*               <th style={{ width: 150 }}>Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted">No rooms found for selected date / filters.</td></tr>
            )}
            {filteredRooms.map(r => (
              <tr key={r.room_number}>
                <td><strong>{r.room_number}</strong></td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {r.status === "checkout_to_new_booking" ? (
                    <div style={{ lineHeight: 1.2 }}>
                      <div>
                        <small className="text-muted">Current: </small>
                        {showNamePhone(r.current_guest_name, r.current_guest_phone)}
                      </div>
                      <div>
                        <small className="text-muted">Next: </small>
                        {showNamePhone(r.next_guest_name, r.next_guest_phone)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {showNamePhone(
                        r.guest_name || r.current_guest_name || r.next_guest_name,
                        r.phone || r.current_guest_phone || r.next_guest_phone
                      )}
                    </div>
                  )}
                </td>


{/*                */}
{/*                 <td> */}
{/*                   <div className="btn-group" role="group"> */}
{/*                     <button className="btn btn-sm btn-outline-primary" onClick={() => alert(`View: ${r.room_number}`)}>View</button> */}
{/*                     <button className="btn btn-sm btn-outline-secondary" onClick={() => alert(`Edit room ${r.room_number}`)}>Edit</button> */}
{/*                   </div> */}
{/*                 </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="d-md-none">
        <div className="row">
          {filteredRooms.map(r => (
            <div className="col-12 mb-2" key={r.room_number}>
              <div className="card">
                <div className="card-body p-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h5 className="mb-0">Room {r.room_number}</h5>
                        <div><StatusBadge status={r.status} /></div>
                      </div>
                      <div className="small text-muted mt-1">
                        {r.status === "checkout_to_new_booking" ? (
                          <>
                            <div>Current: {r.current_guest_name || "—"}</div>
                            <div>Next: {r.next_guest_name || "—"}</div>
                          </>
                        ) : (
                          <div>{r.guest_name || r.current_guest_name || r.next_guest_name || "—"}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-end small">
                      <div>{formatPhone(r.phone || r.current_guest_phone || r.next_guest_phone)}</div>
                      <div className="mt-2">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => alert(`View: ${r.room_number}`)}>View</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => alert(`Edit: ${r.room_number}`)}>Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredRooms.length === 0 && (
            <div className="col-12"><div className="text-center text-muted">No rooms found for selected date / filters.</div></div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        @media print {
          body * { visibility: hidden; }
          .container, .container * { visibility: visible; }
          .container { position: absolute; left: 0; top: 0; width: 100%; }
          .btn, .form-control, .input, .btn-group { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// // StatusBadge component used inside the file
// function StatusBadge({ status }) {
//   const meta = STATUS_META[status] || STATUS_META.unknown;
//   const cls = `badge ${meta.badgeClass}`;
//   return <span className={cls} style={meta.inlineStyle || {}}>{meta.label}</span>;
// }
