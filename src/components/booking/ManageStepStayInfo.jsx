// ManageStepStayInfo.jsx
import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

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
     <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Check-In</Form.Label>
        <Col sm={9}>
          <DatePicker
            selected={stayInfo.checkIn ? new Date(stayInfo.checkIn) : null}
            onChange={(date) => handleCheckInChange(date)}
            showTimeSelect
            dateFormat="dd/MM/yyyy hh:mm a"
            className="form-control"
            placeholderText="Select date & time"
            disabled={disableStayEditing || isCheckedIn}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Check-Out</Form.Label>
        <Col sm={9}>
          <DatePicker
            selected={stayInfo.checkOut ? new Date(stayInfo.checkOut) : null}
            onChange={(date) => handleCheckOutChange(date)}
            showTimeSelect
            dateFormat="dd/MM/yyyy hh:mm a"
            className="form-control"
            placeholderText="Select date & time"
            disabled={disableStayEditing || isCheckedIn}
          />
        </Col>
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
