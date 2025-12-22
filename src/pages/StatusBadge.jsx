import React from "react";
import { Badge } from "react-bootstrap";
//import { STATUS_META } from "../constants/statusMeta";

export const STATUS_META = {
  available: {
    parts: ["Available"],
    colors: ["success"]
  },
  checked_in: {
    parts: ["Checked-In"],
    colors: ["danger"]
  },
  new_booking: {
    parts: ["New Booking"],
    colors: ["primary"]
  },
  continue_checked_in: {
    parts: ["Continue (Checked-In)"],
    colors: ["danger"]
  },
  continue_confirmed: {
    parts: ["Continue (Confirmed)"],
    colors: ["warning"]
  },
  checkout: {
    parts: ["Checkout"],
    colors: ["secondary"]
  },
  checkout_available: {
    parts: ["Checkout", "Available"],
    colors: ["secondary", "success"]
  },
  checkout_to_new_booking: {
    parts: ["Checkout", "New Booking"],
    colors: ["secondary", "primary"]
  },
  checked_in_checkout: {
    parts: ["Checked-In", "Checkout"],
    colors: ["danger", "secondary"]
  },
  checked_in_checkout_to_new_booking: {
    parts: ["Checked-In", "Checkout", "New Booking"],
    colors: ["danger", "secondary", "primary"]
  },
  unknown: {
    parts: ["Unknown"],
    colors: ["orange"]
  }
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.unknown;

  // Single badge case
  if (meta.parts.length === 1) {
    return (
      <Badge bg={meta.colors[0]} className="me-1">
        {meta.parts[0]}
      </Badge>
    );
  }

  // Split badge case
  return (
    <span className="d-inline-flex align-items-center gap-1">
      {meta.parts.map((part, idx) => (
        <Badge key={idx} bg={meta.colors[idx]} className="me-1">
          {part}
        </Badge>
      ))}
    </span>
  );
}
