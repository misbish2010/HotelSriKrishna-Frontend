import { Modal, Button, Form } from "react-bootstrap";
import React, { useState, useMemo } from "react";

const formatDateForApi = (dateStr) => {
  const d = new Date(dateStr);
  return d.toISOString();   // ✅ "2025-08-21T18:10:00.000Z"
};
const CheckInSettlementModal = ({ show, onHide, formData, onConfirm }) => {
  const [extraPayment, setExtraPayment] = useState(0);
  const [paymentMode, setPaymentMode] = useState("");

  // ✅ checkout date-time (default = formData.stayInfo.checkOut or now)
  const [checkInDateTime, setCheckInDateTime] = useState(
    formData?.stayInfo?.checkIn
      ? formatDateForApi(formData.stayInfo.checkIn)
      : formatDateForApi(new Date())
  );

  // ✅ duration in nights (24h blocks)
    const calculateDuration = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return 1;
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const diffMs = outDate - inDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays > 0 ? Math.ceil(diffDays) : 1;
    };

  // ✅ dynamic duration
  const duration = useMemo(
    () => calculateDuration(checkInDateTime, formData?.stayInfo?.checkout),
    [checkInDateTime]
  );


  // ✅ recalc totals
  const totalPaid = (formData.payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const totalPayable = (formData.rooms || []).reduce(
    (sum, r) =>
      sum + ((r.agreedPrice ?? r.pricePerNight ?? 0) * duration),
    0
  );
  const newPaid =
    totalPaid + Number(extraPayment || 0)
  const balance = totalPayable - newPaid;

  const hasPayment = Number(extraPayment || 0) > 0;

const handleConfirm = () => {
  if (hasPayment && !paymentMode) {
    alert("Please select a payment mode.");
    return;
  }

  onConfirm(
    Number(extraPayment || 0),
    paymentMode || null,   // null when no payment
    checkInDateTime
  );
};


  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>CheckIn Booking</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
        <Form.Label>Checkin Date & Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={checkInDateTime}
            onChange={(e) => setCheckInDateTime(e.target.value)}
          />
        </Form.Group>


        <p>
          <strong>Duration:</strong> {duration} night(s)
        </p>
        <p>
          <strong>Total Payable:</strong> ₹{totalPayable}
        </p>
        <p>
          <strong>Already Paid:</strong> ₹{totalPaid}
        </p>
        <p>
          <strong>Balance:</strong> ₹{balance}
        </p>

        <Form.Group className="mb-3">
          <Form.Label>Extra Payment</Form.Label>
          <Form.Control
            type="number"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
          />
        </Form.Group>

<Form.Group className="mb-3">
  <Form.Label>
    Payment Mode{" "}
    {hasPayment && <span className="text-danger">*</span>}
  </Form.Label>


  <Form.Select
    value={paymentMode}
    onChange={(e) => setPaymentMode(e.target.value)}
    required={hasPayment}
  >
    <option value="">-- Select Payment Mode --</option>
    <option value="Cash">Cash</option>
    <option value="UPI">UPI</option>
  </Form.Select>
</Form.Group>


      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={hasPayment && !paymentMode}
        >
          Confirm CheckIn
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CheckInSettlementModal;
