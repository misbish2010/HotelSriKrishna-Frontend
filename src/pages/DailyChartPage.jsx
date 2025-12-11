// File: src/components/DailyChartPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchDailyChart } from "../api"; // adjust path if needed
import StatusBadge from "./StatusBadge.jsx"
import moment from "moment";

const showNamePhone = (name, phone) => {
  if (!name && !phone) return "—";
  if (!name) return `(${formatPhone(phone)})`;
  if (!phone) return name;
  return `${name} (${formatPhone(phone)})`;
};


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
      console.log(data)
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
  <div style={{ lineHeight: 1.2 }}>
    {r.status === "checkout_to_new_booking" ? (
      <>
        <div className="d-flex justify-content-between">
          <div>
            {showNamePhone(r.current_guest_name, r.current_guest_phone)}
          </div>
          <div className="ms-3">
            {showNamePhone(r.next_guest_name, r.next_guest_phone)}
          </div>
        </div>

        <div className="d-flex justify-content-between small">
          <div className="text-secondary">
            {r.current_check_out_time && `CO - ${moment(r.current_check_out_time).format("hh:mm A")}`}
          </div>
          <div className="text-primary ms-3">
            {r.next_check_in_time && `CI - ${moment(r.next_check_in_time).format("hh:mm A")}`}
          </div>
        </div>
      </>
    ) : (
      <>
        <div>
          {showNamePhone(
            r.guest_name || r.current_guest_name || r.next_guest_name,
            r.phone || r.current_guest_phone || r.next_guest_phone
          )}
        </div>

        {r.current_check_out_time && (
          <div className="small text-secondary">
            CO - {moment(r.current_check_out_time).format("hh:mm A")}
          </div>
        )}

        {r.next_check_in_time && (
          <div className="small text-primary">
            CI - {moment(r.next_check_in_time).format("hh:mm A")}
          </div>
        )}
      </>
    )}
  </div>
</td>
                <td>
{/*                   <div className="btn-group" role="group"> */}
{/*                     <button className="btn btn-sm btn-outline-primary" onClick={() => alert(`View: ${r.room_number}`)}>View</button> */}
{/*                   </div> */}
                </td>
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
                        <StatusBadge status={r.status} />
                      </div>

                      {/* Guest Info + Timing */}
                      <div className="small mt-1">
                        {r.status === "checkout_to_new_booking" ? (
                          <>
                            {/* Current Guest */}
                            <div>
                              <small className="text-muted">Current: </small>
                              {showNamePhone(r.current_guest_name, r.current_guest_phone)}
                              {r.current_check_out_time && (
                                <div className="text-danger fw-bold">
                                  CO: {moment(r.current_check_out_time).format("hh:mm A")}
                                </div>
                              )}
                            </div>

                            {/* Next Guest */}
                            <div className="mt-1">
                              <small className="text-muted">Next: </small>
                              {showNamePhone(r.next_guest_name, r.next_guest_phone)}
                              {r.next_check_in_time && (
                                <div className="text-success fw-bold">
                                  CI: {moment(r.next_check_in_time).format("hh:mm A")}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {showNamePhone(
                              r.guest_name || r.current_guest_name || r.next_guest_name,
                              r.phone || r.current_guest_phone || r.next_guest_phone
                            )}
                            {r.current_check_out_time && (
                              <div className="text-danger fw-bold mt-1">
                                CO: {moment(r.current_check_out_time).format("hh:mm A")}
                              </div>
                            )}
                            {r.next_check_in_time && (
                              <div className="text-success fw-bold">
                                CI: {moment(r.next_check_in_time).format("hh:mm A")}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions aligned right */}
{/*                     <div className="text-end small"> */}
{/*                       <button */}
{/*                         className="btn btn-sm btn-outline-primary" */}
{/*                         onClick={() => alert(`View: ${r.room_number}`)} */}
{/*                       > */}
{/*                         View */}
{/*                       </button> */}
{/*                     </div> */}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredRooms.length === 0 && (
            <div className="col-12">
              <div className="text-center text-muted">No rooms found.</div>
            </div>
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
