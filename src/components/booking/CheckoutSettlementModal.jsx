import { Modal, Button, Form } from "react-bootstrap";
import React, { useState, useMemo } from "react";

const formatDateForApi = (dateStr) => {
  const d = new Date(dateStr);
  return d.toISOString();   // ✅ "2025-08-21T18:10:00.000Z"
};
const CheckoutSettlementModal = ({ show, onHide, formData, onConfirm }) => {
  const [extraPayment, setExtraPayment] = useState(0);
  const [extraRefund, setExtraRefund] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");

  // ✅ checkout date-time (default = formData.stayInfo.checkOut or now)
  const [checkoutDateTime, setCheckoutDateTime] = useState(
    formData?.stayInfo?.checkOut
      ? formatDateForApi(formData.stayInfo.checkOut)
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
    () => calculateDuration(formData?.stayInfo?.checkIn, checkoutDateTime),
    [formData?.stayInfo?.checkIn, checkoutDateTime]
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
    totalPaid + Number(extraPayment || 0) + Number(extraDiscount || 0);
  const balance = totalPayable - newPaid;

  const handleConfirm = () => {
    if (balance !== 0) {
      alert("Please settle the full balance before checkout.");
      return;
    }
    // ✅ pass checkoutDate and duration back
    onConfirm(totalPayable, extraRefund, extraPayment, extraDiscount, paymentMode, notes, checkoutDateTime, duration);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Checkout Settlement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
        <Form.Label>Checkout Date & Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={checkoutDateTime}
            onChange={(e) => setCheckoutDateTime(e.target.value)}
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

{balance < 0 ? (
  <Form.Group>
    <Form.Label>Refund Amount</Form.Label>
    <Form.Control
      type="number"
      value={extraPayment} // Refund = negative balance
      onChange={(e) => setExtraRefund(e.target.value)}
      readOnly
    />
  </Form.Group>
) : (
    <>
        <Form.Group className="mb-3">
          <Form.Label>Extra Payment</Form.Label>
          <Form.Control
            type="number"
            value={extraPayment}
            onChange={(e) => setExtraPayment(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Extra Discount</Form.Label>
          <Form.Control
            type="number"
            value={extraDiscount}
            onChange={(e) => setExtraDiscount(e.target.value)}
          />
        </Form.Group>
        </>
)}
        <Form.Group className="mb-3">
          <Form.Label>Payment Mode</Form.Label>
          <Form.Select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={balance !== 0}
        >
          Confirm Checkout
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CheckoutSettlementModal;
