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
  const [paymentMode, setPaymentMode] = useState("");

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

// --------------------
// BASE TOTALS
// --------------------
//✅ recalc totals
  const totalPaid = (formData.payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

const totalPayable = (formData.rooms || []).reduce(
  (sum, r) =>
    sum + ((r.agreedPrice ?? r.pricePerNight ?? 0) * duration),
  0
);

// --------------------
// BEFORE SETTLEMENT
// --------------------
const pendingBeforeSettlement = totalPayable - totalPaid;

// --------------------
// AFTER SETTLEMENT
// --------------------
const finalPayable = totalPayable - Number(extraDiscount || 0);

const finalPaid =
  totalPaid +
  Number(extraPayment || 0) -
  Number(extraRefund || 0);

const finalBalance = finalPayable - finalPaid;


const hasMoneyMovement =
  Number(extraPayment || 0) > 0 || Number(extraRefund || 0) > 0;

  const handleConfirm = () => {
     if (!paymentMode) {
        alert("Please select a payment mode.");
        return;
     }

    if (finalBalance !== 0) {
      alert("Please settle the full balance before checkout.");
      return;
    }


    // ✅ pass checkoutDate and duration back
    onConfirm(totalPayable, extraRefund, extraPayment, extraDiscount, paymentMode || null, notes, checkoutDateTime, duration);
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
          <strong>Balance:</strong> ₹{finalBalance}
        </p>

{pendingBeforeSettlement < 0 ? (

  <Form.Group>
    <Form.Label>Refund Amount</Form.Label>
    <Form.Control
      type="number"
      value={extraRefund}
            onChange={(e) => setExtraRefund(e.target.value)}
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
  <Form.Label>
    Payment Mode{" "}
    {hasMoneyMovement && <span className="text-danger">*</span>}
  </Form.Label>

  <Form.Select
    value={paymentMode}
    onChange={(e) => setPaymentMode(e.target.value)}
    required={hasMoneyMovement}
  >
    <option value="">-- Select Payment Mode --</option>
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
          disabled={(hasMoneyMovement && !paymentMode) || finalBalance !== 0}
        >
          Confirm Checkout
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CheckoutSettlementModal;
