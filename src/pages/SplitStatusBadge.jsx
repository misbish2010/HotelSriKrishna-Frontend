import React from "react";
import { Badge } from "react-bootstrap";

const SplitStatusBadge = ({ left, right }) => {
  const colorMap = {
    "Checkout": "secondary",
    "Available": "success",
    "New Booking": "primary"
  };

  return (
    <div className="d-flex align-items-center gap-1">
      <Badge bg={colorMap[left] || "secondary"}>{left}</Badge>
      <Badge bg={colorMap[right] || "dark"}>{right}</Badge>
    </div>
  );
};

export default SplitStatusBadge;
