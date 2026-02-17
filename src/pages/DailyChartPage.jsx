// File: src/components/DailyChartPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchDailyChart } from "../api"; // adjust path if needed
import StatusBadge from "./StatusBadge.jsx"
import moment from "moment";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { PageHeader } from "./common/PageHeader";
import "./DailyChartPage.css";

const ConflictBadge = ({ conflicts }) => (
  <OverlayTrigger
    placement="right"
    overlay={
      <Tooltip>
        <strong>Room Conflict</strong>
        <hr className="my-1" />
        {conflicts.map((c, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div><strong>{c.guest_name || "Unknown"}</strong></div>
            <div>Status: {c.status}</div>
            <div>
              {moment(c.check_in).format("DD MMM")} →{" "}
              {c.check_out ? moment(c.check_out).format("DD MMM") : "Open"}
            </div>
          </div>
        ))}
      </Tooltip>
    }
  >
    <span className="badge bg-danger ms-2">⚠ Conflict</span>
  </OverlayTrigger>
);


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
        (r.current_guest_name && r.current_guest_name.toLowerCase().includes(q)) ||
        (r.next_guest_name && r.next_guest_name.toLowerCase().includes(q)) ||
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



  function printView() {
    window.print();
  }

  return (
      <>
      <PageHeader
        title="Rooms – Daily Chart"
        subtitle="Room availability for selected date"
        badge="DAY"
      />

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

          <button
            className="btn btn-outline-primary"
            onClick={() => window.print()}
          >
            Print
          </button>


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
            <option value="checkout_completed_available">Checkout Done → Available</option>
            <option value="checkout_completed_to_new_booking">Checkout Done → New Booking</option>
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
                <td>
                  <strong>{r.room_number}</strong>
                  {r.conflict && <ConflictBadge conflicts={r.conflict_bookings || []} />}
                </td>

                <td><StatusBadge status={r.status} /></td>
<td>
  <div style={{ lineHeight: 1.2 }}>
    {r.status === "checkout_to_new_booking" ||
     r.status === "checkout_completed_to_new_booking" ? (
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
    ) :  r.status === "new_booking"  ? (
            // Align new booking to right
            <div className="text-end">
                    <div>
                      {showNamePhone(r.next_guest_name, r.next_guest_phone)}
                    </div>
                    {r.next_check_in_time && (
                      <div className="small text-primary">
                        CI - {moment(r.next_check_in_time).format("hh:mm A")}
                      </div>
                    )}
                  </div>
          ):(
      <>
        <div>
          {showNamePhone(
            r.current_guest_name || r.next_guest_name,
            r.current_guest_phone || r.next_guest_phone
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
                        <h5 className="mb-0">
                          Room {r.room_number}
                          {r.conflict && <ConflictBadge conflicts={r.conflict_bookings || []} />}
                        </h5>

                        <StatusBadge status={r.status} />
                      </div>

                      {/* Guest Info + Timing */}
                      <div className="small mt-1">
                        {r.status === "checkout_to_new_booking" ||
                         r.status === "checkout_completed_to_new_booking" ? (
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
                              r.current_guest_name || r.next_guest_name,
                              r.current_guest_phone || r.next_guest_phone
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

      {/* =========================
          PRINT ONLY LAYOUT
      ========================= */}
      <div className="print-area">

        <div className="print-header">
          <div className="print-header-row">
            <div className="hotel-name">Hotel Sri Krishna</div>
            <div className="print-date">
              Daily Chart – {moment(date).format("DD/MM/YYYY")}
            </div>
          </div>
        </div>

   <div class="print-grid-row"  >
     {/* ================= CHECK-IN TABLE ================= */}
     <div className="print-col">
         <div className="print-section-title">CHECK-IN</div>
               <table className="print-table checkin-table">
                 <thead>
                   <tr>
                     <th>ROOM</th>
                     <th>GUEST NAME</th>
                     <th>CONTACT</th>
                     <th>TIME</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredRooms.map(r => {
                     const isCheckIn =
                       r.status === "new_booking" ||
                       r.status === "checkout_to_new_booking" ||
                       r.status === "checkout_completed_to_new_booking";

                     let note = "";

                     if (
                       r.status === "checked_in" ||
                       r.status === "continue_checked_in"
                     ) {
                       note = "CONT’D";
                     } else if (r.status === "continue_confirmed") {
                       note = "CONT’D";
                     } else if (r.status === "available") {
                       note = "AVAILABLE";
                     }

                     return (
                       <tr key={`ci-${r.room_number}`}>
                         <td>{r.room_number}</td>

                         <td>
                           {isCheckIn
                             ? r.next_guest_name || ""
                             : note}
                         </td>

                         <td>
                           {isCheckIn
                             ? r.next_guest_phone || ""
                             : ""}
                         </td>

                         <td>
                           {isCheckIn && r.next_check_in_time
                             ? moment(r.next_check_in_time).format("hh:mm A")
                             : ""}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>

               </table>
            </div>

     {/* ================= CHECK-OUT TABLE ================= */}
      <div className="print-col">
          <div className="print-section-title">CHECK-OUT</div>

       <table className="print-table checkout-table">
         <thead>
           <tr>
             <th>ROOM</th>
             <th>AMOUNT</th>
             <th>STATUS</th>
             <th>TIME</th>
           </tr>
         </thead>
         <tbody>
           {filteredRooms.map(r => {
             const isCheckout =
               r.status === "checkout_available" ||
               r.status === "checkout_to_new_booking" ||
               r.status === "checkout_completed_available" ||
               r.status === "checkout_completed_to_new_booking";

             const pending = Number(r.pending_amount || 0);

             return (
               <tr key={`co-${r.room_number}`}>
                 <td>{r.room_number}</td>
                 <td>{isCheckout ? pending.toFixed(2) : ""}</td>
                 <td>
                    {isCheckout ? (pending > 0 ? "PENDING" : "PAID") : ""}
                 </td>
                 <td>
                   {isCheckout && r.current_check_out_time
                     ? moment(r.current_check_out_time).format("hh:mm A")
                     : ""}
                 </td>
               </tr>
             );
           })}
         </tbody>
       </table>
       </div>

   </div>
      </div>
    </div>
    </>
  );
}