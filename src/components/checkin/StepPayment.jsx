import React, { useState, useEffect, useRef } from "react";
import { Form, Row, Col, Table } from "react-bootstrap";

/**
 * StepPayment (final)
 * - Per-room mode only
 * - Extra person charge editable per-room only if extraPersons > 0
 * - Auto-fill agreedPrice on first load with GST-inclusive total
 * - If receptionist manually edits agreedPrice it will not be auto-overwritten
 * - Avoids feedback loop: only calls onChange when payload actually changes
 */

const StepPayment = ({ paymentInfo = {}, onChange, gstRate = 12, rooms = [], stayInfo = {} }) => {
  const nights = stayInfo?.duration || 1;

  const [roomPrices, setRoomPrices] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(paymentInfo.paymentAmount || 0);
  const [paymentDate, setPaymentDate] = useState(paymentInfo.paymentDate || new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState(paymentInfo.paymentMode || "");

  const lastSentRef = useRef(null); // keep last sent payload to parent
  const initializedRef = useRef(false); // mark if initial population done

  // Initialize roomPrices only when necessary:
  useEffect(() => {
    // If already initialized and rooms length matches, skip re-initialization
    if (initializedRef.current && roomPrices.length === rooms.length) return;

    if (!rooms || rooms.length === 0) {
      setRoomPrices([]);
      initializedRef.current = true;
      return;
    }

    const initial = rooms.map((room) => {
      const base = room.pricePerNight || room.price || 0;
      const extraCharges = (room.extraPersons || 0) * (room.extraBedPrice || 300);
      const totalWithGST = (base + extraCharges) + ((base + extraCharges) * gstRate / 100);

      // prefer agreed price already present in paymentInfo (from parent),
      // otherwise default to GST-included total. If paymentInfo had it,
      // consider it a manual value so we don't overwrite it later.
      const existing = paymentInfo?.roomAgreedPrices?.find(r => r.roomId === room.roomId);
      const agreedPrice = existing?.agreedPrice != null ? parseFloat(existing.agreedPrice) : parseFloat(totalWithGST.toFixed(2));
      const agreedManually = existing?.agreedPrice != null;

      return {
        ...room,
        roomId: room.roomId || room.id || null,
        extraCharges,
        agreedPrice,
        agreedManually
      };
    });

    setRoomPrices(initial);
    initializedRef.current = true;
    // intentionally not including paymentInfo in dependencies here to avoid overwriting
    // local edits on every parent change; we intentionally re-init only when rooms prop changes
    // or on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, gstRate]);

  // compute total agreed charges (summary)
  const totalAgreedCharges = roomPrices.reduce((sum, r) => sum + (parseFloat(r.agreedPrice || 0) * nights), 0);

  // Build a small payload object representing what we send to parent.
  const buildPaymentPayload = () => ({
    // keep prior paymentInfo fields and override only our relevant ones
    // this mirrors what parent expects for the `payment` section
    ...paymentInfo,
    roomAgreedPrices: roomPrices.map(r => ({
      roomId: r.roomId,
      agreedPrice: parseFloat(r.agreedPrice || 0),
      extraCharges: parseFloat(r.extraCharges || 0)
    })),
    totalPrice: parseFloat(totalAgreedCharges || 0),
    paymentAmount: parseFloat(paymentAmount || 0),
    paymentDate,
    paymentMode
  });

  // Only call onChange when the constructed payload actually differs from last sent payload.
  useEffect(() => {
    const payload = buildPaymentPayload();
    const payloadStr = JSON.stringify(payload);

    if (lastSentRef.current !== payloadStr) {
      lastSentRef.current = payloadStr;
      // push updated payment object up
      onChange(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomPrices, paymentAmount, paymentDate, paymentMode]);

  // Handler when receptionist manually types an agreed price — mark manual override true
  const handleAgreedManualChange = (index, value) => {
    setRoomPrices(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        agreedPrice: parseFloat(value || 0),
        agreedManually: true
      };
      return updated;
    });
  };

  // Handler for extra charges change. Auto-update agreed price only if not manually overridden.
  const handleExtraChargeChange = (index, value) => {
    setRoomPrices(prev => {
      const updated = [...prev];
      const newExtra = parseFloat(value || 0);
      updated[index] = { ...updated[index], extraCharges: newExtra };

      // if receptionist hasn't manually set agreedPrice, auto-fill agreedPrice to new GST-inclusive total
      if (!updated[index].agreedManually) {
        const base = updated[index].pricePerNight || updated[index].price || 0;
        const totalWithGST = (base + newExtra) + ((base + newExtra) * gstRate / 100);
        updated[index].agreedPrice = parseFloat(totalWithGST.toFixed(2));
      }
      return updated;
    });
  };

  // render
  return (
    <div>
      <h5 className="mb-3">Final Price Agreement (Per Room)</h5>

      <Table bordered hover size="sm">
        <thead>
          <tr>
            <th>Room #</th>
            <th>Type</th>
            <th>Base Price/Night</th>
            <th>Extra Person Charges</th>
            <th>Total Price/Night (with GST)</th>
            <th>Agreed Price/Night</th>
          </tr>
        </thead>
        <tbody>
          {roomPrices.map((room, idx) => {
            const base = room.pricePerNight || room.price || 0;
            const extra = parseFloat(room.extraCharges || 0);
            const totalWithGST = (base + extra) + ((base + extra) * gstRate / 100);

            return (
              <tr key={room.roomId ?? idx}>
                <td>{room.roomNumber ?? "-"}</td>
                <td>{room.roomType} {room.isAcRoom ? "(AC)" : "(Non-AC)"}</td>
                <td>₹{Number(base).toFixed(2)}</td>
                <td style={{ minWidth: 140 }}>
                  {room.extraPersons > 0 ? (

                    <Form.Control
                      type="number"
                      step="0.01"
                      value={room.extraCharges || ""}
                      onChange={(e) => handleExtraChargeChange(idx, e.target.value)}
                    />
                  ) : (
                    <>₹0.00</>
                  )}
                </td>
                <td>₹{Number(totalWithGST).toFixed(2)}</td>
                <td style={{ minWidth: 140 }}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={room.agreedPrice || ""}
                    onChange={(e) => handleAgreedManualChange(idx, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Summary */}
      <h5 className="mt-4">Summary</h5>
      <p><strong>Total Price (incl. GST): ₹{Number(totalAgreedCharges).toFixed(2)}</strong></p>

      {/* Payment Details */}
      <Form.Group as={Row} className="mt-3">
        <Form.Label column sm={4}>Payment Amount</Form.Label>
        <Col sm={8}>
          <Form.Control
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mt-3">
        <Form.Label column sm={4}>Payment Date</Form.Label>
        <Col sm={8}>
          <Form.Control
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mt-3">
        <Form.Label column sm={4}>Payment Mode</Form.Label>
        <Col sm={8}>
          <Form.Select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option value="">Select mode</option>
            <option value="cash">Cash</option>
{/*             <option value="card">Credit/Debit Card</option> */}
            <option value="upi">UPI</option>
{/*             <option value="online">Online Transfer</option> */}
          </Form.Select>
        </Col>
      </Form.Group>
    </div>
  );
};

export default StepPayment;
