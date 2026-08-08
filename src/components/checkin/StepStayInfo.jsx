import React, { useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const StepStayInfo = ({ stayInfo, onChange, mode, isAdmin }) => {
  // Format date to readable string (e.g. dd/MM/yyyy hh:mm a)
  const formatDate = (date) => format(date, "dd/MM/yyyy hh:mm a");

  const handleChange = (field, value) => {
    const updated = { ...stayInfo, [field]: value };

    // Auto-calculate duration if both checkIn and checkOut present
    if (field === "checkIn" || field === "checkOut") {
      const checkIn = new Date(updated.checkIn);
      const checkOut = new Date(updated.checkOut);

      if (checkIn && checkOut && checkOut > checkIn) {
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        updated.duration = Math.min(Math.max(days, 1), 10); // max 10 days
      }
    }

    onChange(updated);
  };

  return (
    <div>
      <h5 className="mb-3">Stay Information</h5>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm={3}>Check-In</Form.Label>
          <Col sm={9}>
            <DatePicker
              selected={stayInfo.checkIn ? new Date(stayInfo.checkIn) : null}
              onChange={(date) => handleChange("checkIn", date)}
              showTimeSelect
              dateFormat="dd/MM/yyyy hh:mm a"
              className="form-control"
              placeholderText="Select date & time"
              disabled={!isAdmin}
              minDate={
                isAdmin
                  ? new Date(new Date().setDate(new Date().getDate() - 60))
                  : mode === "advance"
                    ? new Date()
                    : new Date(new Date().setHours(new Date().getHours() + 1)) // walk-in must be at least 1hr later
              }
              maxDate={
                isAdmin
                  ? new Date(new Date().setMonth(new Date().getMonth() + 6)) // 6 months for admin
                  : mode === "advance"
                    ? new Date(new Date().setMonth(new Date().getMonth() + 6)) // allow future
                    : new Date() // restrict future for walk-in
              }
            />
          </Col>
        </Form.Group>


      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Check-Out</Form.Label>
        <Col sm={9}>
          <DatePicker
            selected={stayInfo.checkOut ? new Date(stayInfo.checkOut) : null}
            onChange={(date) => handleChange("checkOut", date)}
            showTimeSelect
            dateFormat="dd/MM/yyyy hh:mm a"
            className="form-control"
            placeholderText="Select date & time"
            disabled={!stayInfo.checkIn}
            minDate={stayInfo.checkIn ? new Date(stayInfo.checkIn) : new Date()}
            maxDate={
              stayInfo.checkIn
                ? new Date(new Date(stayInfo.checkIn).getTime() + 10 * 24 * 60 * 60 * 1000)
                : new Date()
            }
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Duration</Form.Label>
        <Col sm={9}>
          <Form.Control
            type="number"
            value={stayInfo.duration || ""}
            readOnly
            className="bg-light"
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Booking Mode</Form.Label>
        <Col sm={9}>
          <Form.Control
            as="select"
            value={stayInfo.bookingMode || ""}
            onChange={(e) => handleChange("bookingMode", e.target.value)}
            disabled={!isAdmin}
          >
            <option value="">Select</option>
            <option value="WALKIN">WALK-IN</option>
            <option value="ONLINE">ONLINE</option>
            <option value="OVERPHONE">OVER-PHONE</option>
          </Form.Control>
        </Col>
      </Form.Group>
    </div>
  );
};

export default StepStayInfo;