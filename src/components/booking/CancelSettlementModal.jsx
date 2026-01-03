import { Modal, Button, Form } from "react-bootstrap";
import React, { useState, useEffect } from "react";

const CancelSettlementModal = ({ show, onHide, formData, onConfirm }) => {
  const [extraRefund, setExtraRefund] = useState(0);
  const [paymentMode, setPaymentMode] = useState("");
  const totalPaid = (formData.payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  const newPaid = Number(extraRefund || 0) ;
  const balance = totalPaid - newPaid;
  const hasRefund = Number(extraRefund || 0) > 0;

const handleConfirm = () => {
  if (balance !== 0) {
    alert("Please settle the full balance before Cancel.");
    return;
  }

  if (hasRefund && !paymentMode) {
    alert("Please select a payment mode for refund.");
    return;
  }

  onConfirm(
    Number(extraRefund || 0),
    paymentMode || null   // null when no refund
  );
};

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cancel Settlement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Already Paid:</strong> ₹{totalPaid}</p>
        <p><strong>Balance:</strong> ₹{balance}</p>

        <Form.Group>
          <Form.Label>Add Refund</Form.Label>
          <Form.Control
            type="number"
            value={extraRefund}
            onChange={(e) => setExtraRefund(e.target.value)}
          />
        </Form.Group>
<Form.Group className="mb-3">
<Form.Label>
  Payment Mode{" "}
  {hasRefund && <span className="text-danger">*</span>}
</Form.Label>

  <Form.Select
    value={paymentMode}
    onChange={(e) => setPaymentMode(e.target.value)}
    required={hasRefund}
  >
    <option value="">-- Select Payment Mode --</option>
    <option value="Cash">Cash</option>
    <option value="UPI">UPI</option>
  </Form.Select>
</Form.Group>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="success" onClick={handleConfirm}
        disabled={balance !== 0 || (hasRefund && !paymentMode)}
        >
          Confirm Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelSettlementModal;