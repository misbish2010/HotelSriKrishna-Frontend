// ManageStepStayInfo.jsx
import React from "react";
import { Form, Row, Col } from "react-bootstrap";

const ManageStepStayInfo = ({
  stayInfo = {},
  onChange = () => {},
  disableStayEditing = true,
  bookingStatus = ""
}) => {
  const status = (bookingStatus || "").toLowerCase();
  const isCheckedIn = status.includes("checked-in");
  const isConfirmed = status.includes("confirmed");

  const handleCheckInChange = (newCheckIn) => {
    const checkOutDate = new Date(stayInfo.checkOut);
    const checkInDate = new Date(newCheckIn);

    // Adjust duration
    const diffMs = checkOutDate - checkInDate;
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    onChange({
      ...stayInfo,
      checkIn: newCheckIn,
      duration: diffDays
    });
  };

  const handleCheckOutChange = (newCheckOut) => {
    const checkInDate = new Date(stayInfo.checkIn);
    const checkOutDate = new Date(newCheckOut);

    const diffMs = checkOutDate - checkInDate;
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    onChange({
      ...stayInfo,
      checkOut: newCheckOut,
      duration: diffDays
    });
  };

  return (
    <>
      <Form.Group>
        <Form.Label>Check-In Date & Time</Form.Label>
        <Form.Control
          type="datetime-local"
          value={
            stayInfo.checkIn
              ? new Date(stayInfo.checkIn).toISOString().slice(0, 16) // "YYYY-MM-DDTHH:mm"
              : ""
          }
          onChange={(e) => handleCheckInChange(e.target.value)}
          disabled={disableStayEditing || isCheckedIn}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Check-Out Date & Time</Form.Label>
        <Form.Control
          type="datetime-local"
          value={
            stayInfo.checkOut
              ? new Date(stayInfo.checkOut).toISOString().slice(0, 16)
              : ""
          }
          onChange={(e) => handleCheckOutChange(e.target.value)}
          disabled={disableStayEditing}
        />
      </Form.Group>


      <Form.Group>
        <Form.Label>Duration (nights)</Form.Label>
        <Form.Control
          type="number"
          value={stayInfo.duration || 1}
          disabled
        />
      </Form.Group>
    </>
  );
};

export default ManageStepStayInfo;
