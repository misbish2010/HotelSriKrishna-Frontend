import React, { useEffect, useState, useCallback } from "react";
import {
  Row, Col, Form, Badge, Modal, Spinner,
  OverlayTrigger, Tooltip
} from "react-bootstrap";
import { PageHeader } from "./common/PageHeader";
import { fetchDailyChart, fetchMonthlyChart } from "../api";
import { format } from "date-fns";

// ─────────────────────────────────────────────────────────
//  ROOM CONFIG  — mirrors backend ROOM_CONFIG exactly
// ─────────────────────────────────────────────────────────
const ROOM_CONFIG = {
  luxury: {
    ac:     ["001", "101", "201", "203", "205", "301", "305"],  // 7 rooms
    non_ac: ["003", "105"],                                       // 2 rooms
  },
  studio: {
    ac:     ["202", "204", "302", "304"],  // 4 rooms
    non_ac: ["002", "102", "104"],          // 3 rooms
  },
  triple: {
    ac:     ["303"],  // 1 room
    non_ac: ["103"],  // 1 room
  },
};

const ROOM_TOTALS = {
  luxury: { ac: 7, non_ac: 2 },
  studio: { ac: 4, non_ac: 3 },
  triple: { ac: 1, non_ac: 1 },
};

const TOTAL_ROOMS = 18;
const DEFAULT_MMT_LUXURY = 2;
const DEFAULT_MMT_STUDIO = 2;

// ─────────────────────────────────────────────────────────
//  MONTH / YEAR HELPERS
// ─────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function formatDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// ─────────────────────────────────────────────────────────
//  COLOUR LOGIC
// ─────────────────────────────────────────────────────────
function getOccColor(booked) {
  if (booked === 0)      return "green";
  if (booked <= 5)       return "blue";
  if (booked <= 11)      return "yellow";
  if (booked <= 15)      return "orange";
  return "red";
}

// Per sub-category circle colour (booked out of total)
function getChipColor(booked, total) {
  if (total === 0) return "gray";
  const pct = booked / total;
  if (pct === 0)     return "green";
  if (pct <= 0.30)   return "blue";
  if (pct <= 0.60)   return "yellow";
  if (pct <= 0.85)   return "orange";
  return "red";
}

// ─────────────────────────────────────────────────────────
//  INLINE STYLES  (keeps it self-contained, no new CSS file)
// ─────────────────────────────────────────────────────────
const S = {
  // occupancy dot colours
  dot: {
    green:  { background: "#22c55e" },
    blue:   { background: "#3b82f6" },
    yellow: { background: "#eab308" },
    orange: { background: "#f97316" },
    red:    { background: "#ef4444" },
    gray:   { background: "#6b7280" },
  },
  // chip bg / text
  chipBg: {
    green:  { background: "rgba(34,197,94,.13)",  color: "#22c55e" },
    blue:   { background: "rgba(59,130,246,.13)",  color: "#3b82f6" },
    yellow: { background: "rgba(234,179,8,.13)",   color: "#ca8a04" },
    orange: { background: "rgba(249,115,22,.13)",  color: "#ea580c" },
    red:    { background: "rgba(239,68,68,.13)",   color: "#dc2626" },
    gray:   { background: "rgba(107,114,128,.10)", color: "#9ca3af" },
  },
  // category accent
  cat: {
    lux_ac:  { color: "#a78bfa" },
    lux_nac: { color: "#8b5cf6" },
    std_ac:  { color: "#34d399" },
    std_nac: { color: "#059669" },
    trp_ac:  { color: "#fb923c" },
    trp_nac: { color: "#c2410c" },
    mmt:     { color: "#f472b6" },
  },
  mmtBadge: {
    has: { background: "rgba(244,114,182,.15)", color: "#f472b6",
           borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 },
    none: { color: "#6b7280", fontSize: 12 },
  },
  // Past row overrides — everything becomes grey
  pastRow:  { background: "#f0f0f0", borderLeft: "3px solid #d1d5db" },
  pastChip: { background: "#e5e7eb", color: "#9ca3af" },
  pastDot:  { background: "#d1d5db" },
  pastText: { color: "#9ca3af" },
  pastBadge:{ background: "#e5e7eb", color: "#9ca3af",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 },
};

// ─────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────

/** Coloured circle with booked/total inside */
function RoomChip({ booked, total, label, isPast }) {
  const col = getChipColor(booked, total);
  const dim = booked === 0;
  const chipStyle = isPast ? S.pastChip : S.chipBg[col];
  const dotStyle  = isPast ? S.pastDot  : S.dot[col];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        opacity: dim ? 0.3 : 1,
        whiteSpace: "nowrap",
        ...chipStyle,
      }}
    >
      <span
        style={{
          width: 8, height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          ...dotStyle,
        }}
      />
      {booked}/{total} {label}
    </span>
  );
}

/** Large occupancy badge (circle) in date column */
function OccBadge({ booked, color, isPast }) {
  return (
    <div
      style={{
        width: 36, height: 36,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
        ...(isPast ? S.pastChip : S.chipBg[color]),
      }}
    >
      {booked}
    </div>
  );
}

/** MMT booking count badge */
function MmtBadge({ count, isPast }) {
  if (count === 0) return <span style={isPast ? S.pastText : S.mmtBadge.none}>—</span>;
  return <span style={isPast ? S.pastBadge : S.mmtBadge.has}>{count}</span>;
}

/** Suggestion tag */
function SuggestionTag({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return <span style={{ fontSize: 11, color: "#6b7280" }}>✓ All good</span>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {suggestions.map((s, i) => {
        const isClose = s.startsWith("CLOSE");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "2px 7px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              ...(isClose ? S.chipBg.red : S.chipBg.green),
            }}
          >
            {isClose ? "🚫" : "➕"} {s}
          </span>
        );
      })}
    </div>
  );
}

/** Thin occupancy bar */
function OccBar({ pct, color, isPast }) {
  return (
    <div style={{ width: 80 }}>
      <div style={{
        height: 4, background: "#e5e7eb",
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 3,
          transition: "width .4s ease",
          ...(isPast ? S.pastDot : S.dot[color]),
        }} />
      </div>
      <div style={{ fontSize: 10, color: isPast ? "#c0c0c0" : "#9ca3af", textAlign: "right", marginTop: 2 }}>
        {pct}%
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  SUMMARY BAR
// ─────────────────────────────────────────────────────────
function SummaryBar({ days, monthName, year }) {
  const counts = { green:0, blue:0, yellow:0, orange:0, red:0 };
  let totalMmt = 0, totalOcc = 0;
  days.forEach(d => {
    counts[d.color] = (counts[d.color] || 0) + 1;
    totalMmt += d.mmt.luxury + d.mmt.studio + d.mmt.triple;
    totalOcc += d.occupancy_pct;
  });
  const avgOcc = days.length ? (totalOcc / days.length).toFixed(1) : "0";

  const Item = ({ label, value, color }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 60 }}>
      <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color: color || "inherit" }}>
        {value}
      </span>
    </div>
  );

  const Divider = () => (
    <div style={{ width: 1, background: "#e5e7eb", margin: "0 8px", alignSelf: "stretch" }} />
  );

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 4px",
      marginBottom: 12,
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      flexWrap: "wrap",
    }}>
      <Item label="Month" value={`${monthName} ${year}`} />
      <Divider />
      <Item label="Days" value={days.length} />
      <Divider />
      <Item label="🔴 Close MMT" value={counts.red}    color="#dc2626" />
      <Item label="🟠 Warning"   value={counts.orange} color="#ea580c" />
      <Item label="🟡 Filling"   value={counts.yellow} color="#ca8a04" />
      <Item label="🔵 Low"       value={counts.blue}   color="#3b82f6" />
      <Item label="🟢 Empty"     value={counts.green}  color="#16a34a" />
      <Divider />
      <Item label="MMT Total" value={totalMmt} color="#db2777" />
      <Item label="Avg Occ."  value={`${avgOcc}%`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  DAILY MODAL  (reuses existing daily-chart API)
// ─────────────────────────────────────────────────────────
const LUXURY_ROOMS = ["001","003","101","105","201","203","205","301","305"];
const STUDIO_ROOMS = ["002","102","104","202","204","302","304"];
const TRIPLE_ROOMS = ["103","303"];

const STATUS_LABEL = {
  available:                      "Available",
  checked_in:                     "Checked In",
  new_booking:                    "New Booking",
  continue_checked_in:            "Staying",
  continue_confirmed:             "Confirmed",
  checkout_available:             "Checkout Pending",
  checkout_completed_available:   "Checked Out",
  checkout_to_new_booking:        "Chk-out → New",
  checkout_completed_to_new_booking: "Done → New",
};

const STATUS_VARIANT = {
  available:                    { bg:"#dcfce7", color:"#166534" },
  checked_in:                   { bg:"#dbeafe", color:"#1e40af" },
  new_booking:                  { bg:"#fef9c3", color:"#854d0e" },
  continue_checked_in:          { bg:"#dbeafe", color:"#1e40af" },
  continue_confirmed:           { bg:"#dbeafe", color:"#1e40af" },
  checkout_available:           { bg:"#ffedd5", color:"#9a3412" },
  checkout_completed_available: { bg:"#f3f4f6", color:"#374151" },
  checkout_to_new_booking:      { bg:"#fae8ff", color:"#86198f" },
  checkout_completed_to_new_booking: { bg:"#fae8ff", color:"#86198f" },
};

function RoomCard({ room }) {
  const status = room.status || "available";
  const sv = STATUS_VARIANT[status] || { bg: "#f3f4f6", color: "#374151" };
  const guestName = room.current_guest_name || room.next_guest_name || room.guest_name || "";
  const phone     = room.current_guest_phone || room.next_guest_phone || room.phone || "";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
        Room {room.room_number}
      </div>
      <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase",
                    letterSpacing: ".4px", marginBottom: 6 }}>
        {room.room_type || ""}
      </div>
      <span style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        background: sv.bg,
        color: sv.color,
      }}>
        {STATUS_LABEL[status] || status}
      </span>
      {guestName && (
        <div style={{ fontSize: 11, fontWeight: 500, color: "#111827", marginTop: 5,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {guestName}
        </div>
      )}
      {phone && (
        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{phone}</div>
      )}
      {room.conflict && (
        <Badge bg="warning" style={{ marginTop: 4, fontSize: 9 }}>⚠ Conflict</Badge>
      )}
    </div>
  );
}

function DailyModal({ dateStr, onClose }) {
  const [rooms, setRooms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dateStr) return;
    setLoading(true); setError(null); setRooms(null);
    fetchDailyChart(dateStr, 1)
      .then(data => setRooms(data.rooms || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateStr]);

  const dateObj   = dateStr ? new Date(dateStr + "T00:00:00") : null;
  const dateLabel = dateObj
    ? format(dateObj, "EEEE, d MMMM yyyy")
    : "";

  function Section({ title, accent, roomNums }) {
    if (!rooms) return null;
    const filtered = rooms.filter(r => roomNums.includes(r.room_number));
    if (!filtered.length) return null;
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: ".5px",
          marginBottom: 8,
        }}>
          {title}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 8,
        }}>
          {filtered.map(r => <RoomCard key={r.room_number} room={r} />)}
        </div>
      </div>
    );
  }

  return (
    <Modal show={!!dateStr} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>{dateLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <Spinner animation="border" size="sm" /> Loading rooms…
          </div>
        )}
        {error && (
          <div style={{ color: "#dc2626", padding: 20, textAlign: "center" }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && rooms && (
          <>
            <Section title="Luxury Rooms"  accent="#a78bfa" roomNums={LUXURY_ROOMS} />
            <Section title="Studio Rooms"  accent="#34d399" roomNums={STUDIO_ROOMS} />
            <Section title="Triple Rooms"  accent="#fb923c" roomNums={TRIPLE_ROOMS} />
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
//  LEGEND
// ─────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { color: "green",  label: "Empty (0 rooms)" },
    { color: "blue",   label: "Low (1–5)" },
    { color: "yellow", label: "Filling (6–11)" },
    { color: "orange", label: "Warning (12–15)" },
    { color: "red",    label: "Full — Close MMT (16+)" },
  ];
  const cats = [
    { style: S.cat.lux_ac,  label: "AC Luxury (7)" },
    { style: S.cat.lux_nac, label: "Non-AC Luxury (2)" },
    { style: S.cat.std_ac,  label: "AC Studio (4)" },
    { style: S.cat.std_nac, label: "Non-AC Studio (3)" },
    { style: S.cat.trp_ac,  label: "AC Triple (1)" },
    { style: S.cat.trp_nac, label: "Non-AC Triple (1)" },
    { style: S.cat.mmt,     label: "MMT Bookings" },
  ];

  return (
    <div style={{
      background: "#f8fafc",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 14,
    }}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af",
                       textTransform: "uppercase", letterSpacing: ".5px", marginRight: 4 }}>
          Occupancy
        </span>
        {items.map(i => (
          <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 5,
                                      fontSize: 11, color: "#6b7280" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%",
                           flexShrink: 0, ...S.dot[i.color] }} />
            {i.label}
          </div>
        ))}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function MonthlyOverview() {
  const now = new Date();
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [year, setYear]         = useState(now.getFullYear());
  const [days, setDays]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [modalDate, setModalDate] = useState(null);

  const todayStr = now.toISOString().slice(0, 10);

  // Year options
  const yearOpts = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 2; y++) yearOpts.push(y);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonthlyChart(month, year);
      setDays(data.days || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // Auto-load on mount
  useEffect(() => { load(); }, []);

  // ── Table header ──
  const thStyle = (accent) => ({
    padding: "6px 10px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".6px",
    textTransform: "uppercase",
    color: accent || "#9ca3af",
    textAlign: "center",
    whiteSpace: "nowrap",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  });

  const tdStyle = {
    padding: "8px 10px",
    border: "1px solid #f0f0f0",
    verticalAlign: "middle",
    background: "#fff",
  };

  const tdCenterStyle = {
    ...tdStyle,
    textAlign: "center",
  };

  return (
    <>
      <PageHeader
        title="Monthly Booking Overview"
        subtitle="Occupancy, categories and MMT status for any month"
        badge="Monthly"
      />

      {/* ── Controls ── */}
      <Row className="mb-3 align-items-end">
        <Col xs="auto">
          <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            Month
          </Form.Label>
          <Form.Select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            style={{ fontSize: 13, minWidth: 130 }}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs="auto">
          <Form.Label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            Year
          </Form.Label>
          <Form.Select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ fontSize: 13 }}
          >
            {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto">
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "8px 20px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? .6 : 1,
              marginTop: 24,
            }}
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </Col>
        <Col>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 24 }}>
            Click any row to see full room status for that day
          </div>
        </Col>
      </Row>

      {/* ── Legend ── */}
      <Legend />

      {/* ── Summary bar ── */}
     {/* days.length > 0 && (
        <SummaryBar days={days} monthName={MONTH_NAMES[month - 1]} year={year} />
      ) */}

      {/* ── States ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: 50, color: "#9ca3af" }}>
          <Spinner animation="border" size="sm" style={{ marginRight: 8 }} />
          Loading booking data…
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: 20, textAlign: "center", color: "#dc2626",
          background: "#fef2f2", borderRadius: 8, border: "1px solid #fca5a5",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Main table ── */}
      {!loading && !error && days.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            minWidth: 900,
          }}>
            <thead>
              {/* Category row */}
              <tr>
                <th rowSpan={2} style={{ ...thStyle(), textAlign:"left", width:130 }}>Date</th>
                <th colSpan={2} style={thStyle("#8b5cf6")}>LUXURY</th>
                <th colSpan={2} style={thStyle("#059669")}>STUDIO</th>
                <th colSpan={2} style={thStyle("#fb923c")}>TRIPLE</th>
                <th colSpan={2} style={thStyle("#f472b6")}>MMT BOOKINGS</th>
                <th rowSpan={2} style={{ ...thStyle(), width:190 }}>Suggestion</th>
                <th rowSpan={2} style={{ ...thStyle(), width:90 }}>Occupancy</th>
              </tr>
              {/* Sub-category row */}
              <tr>
                <th style={thStyle("#8b5cf6")}>AC (7)</th>
                <th style={thStyle("#8b5cf6")}>Non-AC (2)</th>
                <th style={thStyle("#059669")}>AC (4)</th>
                <th style={thStyle("#059669")}>Non-AC (3)</th>
                <th style={thStyle("#fb923c")}>AC (1)</th>
                <th style={thStyle("#fb923c")}>Non-AC (1)</th>
                <th style={thStyle("#f472b6")}>Luxury</th>
                <th style={thStyle("#f472b6")}>Studio</th>
              </tr>
            </thead>

            <tbody>
              {days.map(d => {
                const isToday   = d.date === todayStr;
                const isPast    = d.date < todayStr;
                const dateObj   = new Date(d.date + "T00:00:00");
                const dayOfWeek = dateObj.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const dateLabel = format(dateObj, "EEE, dd MMM yyyy");

                const rowStyle = isPast ? {
                  // ── PAST ROW — clear grey block ───────────────
                  cursor:     "default",
                  background: "#f0f0f0",
                  borderLeft: "3px solid #d1d5db",
                  transition: "background .12s",
                } : {
                  // ── FUTURE / TODAY ROW ────────────────────────
                  cursor:     "pointer",
                  background: isToday ? "#eff6ff" : isWeekend ? "#fafafa" : "#fff",
                  borderLeft: isToday ? "3px solid #3b82f6" : "3px solid transparent",
                  transition: "background .12s",
                };

                return (
                  <tr
                    key={d.date}
                    style={rowStyle}
                    onClick={() => !isPast && setModalDate(d.date)}
                    onMouseEnter={e => {
                      if (!isPast) e.currentTarget.style.background = "#f0f9ff";
                    }}
                    onMouseLeave={e => {
                      if (isPast) return;
                      e.currentTarget.style.background =
                        isToday ? "#eff6ff" : isWeekend ? "#fafafa" : "#fff";
                    }}
                  >
                    {/* DATE */}
                    <td style={{ ...tdStyle, padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <OccBadge booked={d.total_booked} color={d.color} isPast={isPast} />
                        <div>
                          <div style={{ fontSize: 11, color: isPast ? "#b0b0b0" : "#6b7280" }}>
                            {format(dateObj, "EEE")}
                            {isToday && (
                              <span style={{
                                marginLeft: 5,
                                fontSize: 9, fontWeight: 700,
                                background: "#3b82f6", color: "#fff",
                                padding: "1px 5px", borderRadius: 3,
                              }}>TODAY</span>
                            )}
                            {isPast && !isToday && (
                              <span style={{
                                marginLeft: 5,
                                fontSize: 9, fontWeight: 600,
                                background: "#d1d5db", color: "#9ca3af",
                                padding: "1px 5px", borderRadius: 3,
                              }}>PAST</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                            color: isPast ? "#b0b0b0" : "#111827",
                          }}>
                            {format(dateObj, "dd MMM yyyy")}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LUXURY AC */}
                    <td style={tdCenterStyle}>
                      <RoomChip
                        booked={d.luxury.ac.booked}
                        total={d.luxury.ac.total}
                        label="AC"
                      isPast={isPast}
                      />
                    </td>

                    {/* LUXURY NON-AC */}
                    <td style={tdCenterStyle}>
                      <RoomChip
                        booked={d.luxury.non_ac.booked}
                        total={d.luxury.non_ac.total}
                        label="Non-AC"
                      isPast={isPast}
                      />
                    </td>

                    {/* STUDIO AC */}
                    <td style={tdCenterStyle}>
                      <RoomChip
                        booked={d.studio.ac.booked}
                        total={d.studio.ac.total}
                        label="AC"
                      isPast={isPast}
                      />
                    </td>

                    {/* STUDIO NON-AC */}
                    <td style={tdCenterStyle}>
                      <RoomChip
                        booked={d.studio.non_ac.booked}
                        total={d.studio.non_ac.total}
                        label="Non-AC"
                      isPast={isPast}
                      />
                    </td>

                    {/* TRIPLE AC */}
                    <td style={tdCenterStyle}>
                      <RoomChip
                        booked={d.triple.ac.booked}
                        total={d.triple.ac.total}
                        label="AC"
                      isPast={isPast}
                      />
                    </td>

                    {/* TRIPLE NON-AC */}
                    <td style={tdCenterStyle}>
                      <RoomChip
                        booked={d.triple.non_ac.booked}
                        total={d.triple.non_ac.total}
                        label="Non-AC"
                      isPast={isPast}
                      />
                    </td>

                    {/* MMT LUXURY */}
                    <td style={tdCenterStyle}>
                      <MmtBadge count={d.mmt.luxury} isPast={isPast} />
                    </td>

                    {/* MMT STUDIO */}
                    <td style={tdCenterStyle}>
                      <MmtBadge count={d.mmt.studio} isPast={isPast} />
                    </td>

                    {/* SUGGESTION */}
                    <td style={tdStyle}>
                      {isPast
                        ? <span style={{ color: "#c0c0c0", fontSize: 11 }}>—</span>
                        : <SuggestionTag suggestions={d.suggestions} />
                      }
                    </td>

                    {/* OCCUPANCY BAR */}
                    <td style={tdCenterStyle}>
                      <OccBar pct={d.occupancy_pct} color={d.color} isPast={isPast} />
                    </td>


                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Daily detail modal ── */}
      <DailyModal
        dateStr={modalDate}
        onClose={() => setModalDate(null)}
      />
    </>
  );
}