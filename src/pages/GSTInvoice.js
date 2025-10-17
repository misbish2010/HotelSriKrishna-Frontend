// src/pages/GSTInvoice.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { fetchBookingById, updateGSTInfo, fetchGSTInvoice } from "../api";
import "./gst-invoice.css";


const HOTEL = {
  name: "Hotel Sri Krishna",
  address1: "Amli Kutir Road, Koraput",
  address2: "Land Mark: Behind Bus Stand",
  cityLine: "Odisha, 764020",
  email: "hotelsrikrishnakoraput@gmail.com",
  phones: "Phone No.: 06852 357172",
  gstin: "GSTIN: 21AHSPM7680F1Z1",
  logo: process.env.PUBLIC_URL + "/static/images/logo.png",
  taxRatePct: 5, // screenshot shows 5%
};


const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const formatDT = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";
const rupee = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
const ddmmyyyy = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

export default function GSTInvoice({ bookingId, bookingDetails, onClose, mode = "single" }) {
  const [booking, setBooking] = useState(bookingDetails || null);
  const [gstForm, setGstForm] = useState({
    gst_bill_no: "",
    guest_gst_no: "",
    guest_company_name: "",
  });

  useEffect(() => {
    async function load() {
      if (!booking) {
        const data = await fetchBookingById(bookingId);
        const bk = data.bookingDetails?.[0] || {};
        setBooking(bk);
        setGstForm({
          gst_bill_no: bk?.gst_info?.gst_bill_no || "",
          guest_gst_no: bk?.gst_info?.guest_gst_no || "",
          guest_company_name: bk?.gst_info?.guest_company_name || "",
        });
      } else {
        setGstForm({
          gst_bill_no: booking?.gst_info?.gst_bill_no || "",
          guest_gst_no: booking?.gst_info?.guest_gst_no || "",
          guest_company_name: booking?.gst_info?.guest_company_name || "",
        });
      }
    }
    load();
  }, [bookingId, booking]);


  if (!booking) return <div>Loading invoice...</div>;

  const guest = booking.customer_info || {};
  const stay = booking.stay_info || {};
  const status = booking.booking_status || "";

  // booking.payments = array of { amount, status, mode }

  const calc = (() => {
    const roomRows = (booking.room_details || []).map((r, idx) => {
      const nights = stay.duration || 1;
      const grossPrice = r.room_price || 0; // already includes GST
      const netPrice = grossPrice / (1 + HOTEL.taxRatePct / 100); // base before GST
      const gstAmount = grossPrice - netPrice;

      return {
        key: idx,
        label: `${r.room_number} – ${r.room_type}`,
        checkIn: stay.check_in_date,
        checkOut: stay.check_out_date || stay.probable_check_out_date,
        nights,
        netPrice,
        gstAmount,
        pricePerDay: grossPrice,
        amount: nights * grossPrice,
      };
    });

    const subTotal = roomRows.reduce((s, r) => s + r.netPrice * r.nights, 0);
    const tax = roomRows.reduce((s, r) => s + r.gstAmount * r.nights, 0);
    const grand = subTotal + tax;


//    const paid = (booking.payment_info || [])
//       .filter((p) => p.status === 'paid')
//       .reduce((sum, p) => sum + (p.amount || 0), 0);

const paid = (booking.payment_info || [])
  .filter((p) => ["paid", "completed"].includes((p.status || "").toLowerCase()))
  .reduce((sum, p) => sum + (p.amount || 0), 0);

    const net_price = paid / (1 + HOTEL.taxRatePct / 100); // base before GST
    const gst_price = paid - net_price


    const balance = grand - paid;

    return { roomRows, subTotal, tax, grand, paid, balance, gst_price, net_price  };
  })();

const handleSaveGST = async () => {
  try {
    const data = await fetchGSTInvoice(bookingId);

    const { gst_bill_no, gst_bill_date } = data;

    // Build updated object directly
    const updatedGST = {
      ...gstForm,
      gst_bill_no,
      gst_bill_date,
    };

    setGstForm(updatedGST); // update state for UI
    await updateGSTInfo(bookingId, updatedGST); // send correct payload
    alert("GST details updated!");
  } catch (e) {
    console.error(e);
    alert("Failed to update GST info");
  }
};
  return (
    <Card className="invoice-card print-friendly">
      <Card.Header className="invoice-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          {HOTEL.logo && (
            <img src={HOTEL.logo} alt="Logo" className="hotel-logo-img" />
          )}
          <div>
            <h4 className="mb-0">{HOTEL.name}</h4>
            <small>
              {HOTEL.address1}, {HOTEL.cityLine}
            </small>
            <div>
                <small>
                   {HOTEL.address2}
               </small>
            </div>
            <div>
                <small>
                   {HOTEL.email}
               </small>
            </div>
            <div>
                <small>
                   {HOTEL.phones}
               </small>
            </div>
            <div>
                   {HOTEL.gstin}
            </div>
          </div>
        </div>
        <div className="text-end">
          <h3 className="m-0">INVOICE</h3>
          <div>Date: {ddmmyyyy(new Date())}</div>
          <div>Bill No.: {gstForm.gst_bill_no || "-"}</div>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Guest & Stay Info */}
        <div className="info-row">
            <Row className="mb-3 w-100">
              <Col md={6} className="p-2 border rounded info-box">
                <h6 className="fw-bold">Billing To:</h6>
                <div>Name: {guest.name || "-"}</div>
                <div>Address: {guest.address || "-"}</div>
                <div>Phone: {guest.phone || "-"}</div>
                <div>Aadhar: {guest.identity || "-"}</div>
                {/* Print-only fields */}
                {gstForm.guest_company_name && (
                  <div>Company: {gstForm.guest_company_name}</div>
                )}
                {gstForm.guest_gst_no && (
                  <div>GSTIN: {gstForm.guest_gst_no}</div>
                )}


              </Col>

              <Col md={6} className="p-2 border rounded info-box">
                <h6 className="fw-bold">Stay Details:</h6>
                <div>Check-in: {formatDT(stay.check_in_date)}</div>
                <div>Check-out: {formatDT(stay.check_out_date || stay.probable_check_out_date)}</div>
                <div>No. of Days: {stay.duration || "-"}</div>
              </Col>
            </Row>
          </div>

        {/* GST Inputs */}
        {mode === "single" && (
        <Row className="mb-3">

          <Col md={6}>
          <div className="d-print-none">
            <Form.Group>
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                value={gstForm.guest_company_name}
                onChange={(e) =>
                  setGstForm((s) => ({
                    ...s,
                    guest_company_name: e.target.value,
                  }))
                }
              />
            </Form.Group>
            </div>
          </Col>


          <Col md={6}>
        <div className="d-print-none">
            <Form.Group>
              <Form.Label>Guest GSTIN</Form.Label>
              <Form.Control
                value={gstForm.guest_gst_no}
                onChange={(e) =>
                  setGstForm((s) => ({
                    ...s,
                    guest_gst_no: e.target.value.toUpperCase(),
                  }))
                }
                isInvalid={
                  Boolean(gstForm.guest_gst_no) &&
                  !gstinRegex.test(gstForm.guest_gst_no)
                }
              />
            </Form.Group>
          </div>
          </Col>

        </Row>
        )}

        {/* Rooms Table */}
        <table className="table table-bordered mt-3">
          <thead className="table-light">
            <tr>
              <th>Room No.</th>
              <th>Room Type</th>
              <th>Check in</th>
              <th>Check out</th>
              <th>Days</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {calc.roomRows.map((r) => (
              <tr key={r.key}>
                <td>{r.label.split(" – ")[0]}</td>
                <td>{r.label.split(" – ")[1]}</td>
                <td>{formatDT(r.checkIn)}</td>
                <td>{formatDT(r.checkOut)}</td>
                <td>{r.nights}</td>
                <td>{rupee(r.pricePerDay)}</td>
                <td>{rupee(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <Row className="justify-content-end">
          <Col md={5}>
            <div className="totals-box p-3 border rounded">
              <div className="d-flex justify-content-between">
                <span>Sub Total</span>
                <span>{rupee(calc.net_price.toFixed(2))}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tax ({HOTEL.taxRatePct}%)</span>
                <span>{rupee(calc.gst_price.toFixed(2))}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold border-top pt-2">
                <span>Total</span> <span>{rupee(calc.paid)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Paid</span> <span>{rupee(calc.paid)}</span>
              </div>
                {calc.balance !== 0 && (
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Discount</span>
                    <span>{rupee(Math.abs(calc.balance))}</span>
                  </div>
                )}
            </div>
          </Col>
        </Row>

        {/* Buttons */}
        {mode === "single" && (
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSaveGST}>
              Save GST Info
            </Button>
            <Button variant="success" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        )}


        {/* Signatures */}
        <div className="signature-section">
          <div className="signature-box">
            <img src={`${process.env.PUBLIC_URL}/static/images/hotel-stamp-preview.png`} alt="Manager Stamp" className="stamp" />
            <p>Manager Signature<br/><strong>Hotel Sri Krishna</strong></p>
          </div>
          <div className="signature-box">
            <p>Guest's Signature</p>
          </div>
        </div>

        <div className="text-center mt-4 fw-bold">
          THANK YOU FOR YOUR VISIT, PLEASE VISIT US AGAIN!
        </div>
      </Card.Body>
    </Card>
  );
}
