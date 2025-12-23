// ManageStepPayment.jsx
import React from "react";
import { Table, Button, Form, Row, Col } from "react-bootstrap";

const ManageStepPayment = ({ paymentInfo = [], onChange = () => {}, rooms = [], stayInfo = {}, disablePaymentEditing = true, onAddPayment, onRemovePayment, onPaymentChange }) => {
  const nights = stayInfo?.duration || 1;

  // agreed price from room objects (DB or edited)
  const roomPrices = rooms.map((r) => ({ ...r, agreedPrice: r.agreedPrice ?? r.pricePerNight ?? 0 }));

  const totalAgreed = roomPrices.reduce((sum, r) => sum + (Number(r.agreedPrice || 0) * nights), 0);

  const paymentsArray = Array.isArray(paymentInfo) ? paymentInfo : (paymentInfo.payments || []);

  return (
    <div>
      <h5 className="mb-3">Final Price Agreement (Per Room)</h5>

      <Table bordered hover size="sm">
        <thead>
          <tr><th>Room #</th><th>Type</th><th>Price/Night</th><th>Agreed/Night</th></tr>
        </thead>
        <tbody>
          {roomPrices.map((room, i) => (
            <tr key={i}>
              <td>{room.roomNumber ?? "-"}</td>
              <td>{room.roomType} {room.isAcRoom ? "(AC)" : ""}</td>
              <td>₹{Number(room.pricePerNight || 0).toFixed(2)}</td>
              <td>
                {disablePaymentEditing ? <>₹{Number(room.agreedPrice || 0).toFixed(2)}</> : (
                  <Form.Control type="number" value={room.agreedPrice || 0} onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    // update parent rooms agreed price
                    const updated = rooms.map((rr, idx) => idx === i ? ({ ...rr, agreedPrice: val }) : rr);
                    onChange(updated); // this call intentionally reuses onChange to pass updated rooms when editing agreed prices
                  }} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h5 className="mt-3">Summary: ₹{Number(totalAgreed).toFixed(2)}</h5>

      <h5 className="mt-4">Payment History</h5>
      {disablePaymentEditing ? (
        <Table bordered hover>
          <thead><tr><th>Amount</th><th>Mode</th><th>Date</th><th>Notes</th></tr></thead>
          <tbody>
            {paymentsArray.length ? paymentsArray.map((p, i) => (
              <tr key={i}>
                <td>₹{Number(p.amount || p.paymentAmount || 0).toFixed(2)}</td>
                <td>{p.mode || p.paymentMode || "-"}</td>
                <td>{p.date ? new Date(p.date).toLocaleString() : ""}</td>
                <td>{p.notes || "-"}</td>
              </tr>
            )) : <tr><td colSpan={5} className="text-center">No payment records</td></tr>}
          </tbody>
        </Table>
      ) : (
        <>
          <Table bordered hover>
            <thead><tr><th>Amount</th><th>Mode</th><th>Date</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {paymentsArray.map((p, i) => (
                <tr key={i}>
                  <td><Form.Control type="number" value={p.amount ?? p.paymentAmount ?? ""} onChange={(e) => onPaymentChange(i, "amount", Number(e.target.value))} /></td>
                  <td><Form.Select value={p.mode ?? p.paymentMode ?? ""} onChange={(e) => onPaymentChange(i, "mode", e.target.value)}><option value="">Select</option><option value="cash">Cash</option><option value="upi">UPI</option></Form.Select></td>
                  <td><Form.Control type="date" value={(p.date ?? p.paymentDate ?? "").slice(0,10)} onChange={(e) => onPaymentChange(i, "date", e.target.value)} /></td>
                  <td><Form.Control value={p.notes || ""} onChange={(e) => onPaymentChange(i, "notes", e.target.value)} /></td>
                  <td><Button size="sm" variant="danger" onClick={() => onRemovePayment && onRemovePayment(i)}>Remove</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button onClick={() => onAddPayment && onAddPayment()}>Add Payment</Button>
        </>
      )}
    </div>
  );
};

export default ManageStepPayment;
