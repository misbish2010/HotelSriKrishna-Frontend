// src/pages/GSTInvoice.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { fetchBookingById, updateGSTInfo, fetchGSTInvoice } from "../api";
import "./gst-invoice.css";
//import { sendWhatsAppGSTInvoice } from "../utils/sendWhatsAppGSTInvoice";
import html2canvas from "html2canvas";
import ReceiptPreviewModal from "../components/ReceiptPreviewModal"; // adjust path
import { ToWords } from "to-words";

const toWords = new ToWords({
  localeCode: "en-IN",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
  },
});

const HOTEL = {
  name: "Hotel Sri Krishna",
  address1: "Amla Kutir Road, Koraput",
  address2: "Land Mark: Behind Bus Stand",
  cityLine: "Odisha, 764020",
  email: "hotelsrikrishnakoraput@gmail.com",
  phones: "Phone No.: 06852 357172",
  gstin: "GSTIN: 21AHSPM7680F1Z1",
  logo: process.env.PUBLIC_URL + "/static/images/logo-square.png",
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

export default function GSTInvoice({ bookingId, bookingDetails, onClose,mode = "single" }) {
  const [booking, setBooking] = useState(bookingDetails || null);
  const [gstForm, setGstForm] = useState({
    gst_bill_no: "",
    guest_gst_no: "",
    guest_company_name: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    imgData: null,
    whatsappLink: null,
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
  console.log(booking)

  // booking.payments = array of { amount, status, mode }

  const calc = (() => {
    const roomRows = (booking.room_details || []).map((r, idx) => {
      const nights = stay.duration || 1;
      const grossPrice = r.room_price || 0; // already includes GST
      const netPrice = grossPrice / (1 + HOTEL.taxRatePct / 100); // base before GST
      const gstAmount = grossPrice - netPrice;
        const roomType = (r.room_type || "").toLowerCase();
        const occupancy = (r.occupancy || "").toLowerCase();

        let roomLabel = "";

        if (roomType === "triple") {
          roomLabel = "Triple";
        } else {
          roomLabel = `${r.occupancy} ${r.room_type}`;
        }
      return {
        key: idx,
        label: `${r.room_number} – ${r.is_ac ? "AC " : "Non AC "} ${roomLabel}`,
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
  .filter((p) => ["paid", "completed", "refund"].includes((p.status || "").toLowerCase()))
  .reduce((sum, p) => {
    const amount = Number(p.amount || 0);

    if ((p.status|| "").toLowerCase() === "refund") {
      return sum - amount;
    }

    return sum + amount;
  }, 0);

    const net_price = paid / (1 + HOTEL.taxRatePct / 100); // base before GST
    const gst_price = paid - net_price


    const balance = grand - paid;

    return { roomRows, subTotal, tax, grand, paid, balance, gst_price, net_price  };
  })();

const handleSendWhatsAppGST = async () => {
  try {
    const element = window.__gstInvoiceRef;
    if (!element) return alert("Invoice not ready");

    // ✅ Force print layout
    element.classList.add("print-mode");
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    element.classList.remove("print-mode");

    const imgData = canvas.toDataURL("image/png");

    const phone = booking?.customer_info?.phone;
    const text = encodeURIComponent(
      `GST Invoice from Hotel Sri Krishna\nBill No: ${gstForm.gst_bill_no}`
    );

    const whatsappLink = phone
      ? `https://wa.me/91${phone}?text=${text}`
      : null;

    setPreviewData({ imgData, whatsappLink });
    setShowPreview(true);
  } catch (err) {
    console.error(err);
    alert("Failed to generate GST invoice image");
  }
};


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
    <>
    <div
      id="gst-capture-wrapper"
      ref={(el) => (window.__gstInvoiceRef = el)}
      className="print-friendly"
    >
      <Card className="invoice-card">

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
          <div>Date: {ddmmyyyy(new Date(stay.check_out_date || stay.probable_check_out_date))}</div>
          <div>Booking Id: {bookingId || "-"}</div>
          <div>Bill No.: {gstForm.gst_bill_no || "-"}</div>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Guest & Stay Info */}
        <div className="info-row">
            <Row className="mb-2 w-100">
              <Col md={6} className="p-2 border rounded info-box">
                <h6 className="fw-bold">Billing To:</h6>
                <div>Name: {(guest.name || "-").toUpperCase()}</div>
                <div>Address: {(guest.address || "-").toUpperCase()}</div>
                <div>Phone: {guest.phone || "-"}</div>
                {/*<div>Aadhar: {guest.identity || "-"}</div>*/}
                {/* Print-only fields */}
                {gstForm.guest_company_name && (
                  <div>Company Name: {(gstForm.guest_company_name).toUpperCase()}</div>
                )}
                {gstForm.guest_gst_no && (
                  <div>Guest GSTIN: {(gstForm.guest_gst_no).toUpperCase()}</div>
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
            {/*<Button variant="success" onClick={() => window.print()}>
              Print
            </Button>*/}
            {gstForm.gst_bill_no && (
              <Button
                variant="success"
                style={{ backgroundColor: "#25D366", border: "none" }}
                onClick={handleSendWhatsAppGST}
              >
                📲 Send GST Bill on WhatsApp
              </Button>
            )}

          </div>
        )}

        <div className="text-center mt-2 fw-bold">
          <strong>Amount in Words:</strong> {toWords.convert(calc.paid)}
        </div>

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

        <div className="text-center mt-2 fw-bold">
          THANK YOU !!! PLEASE VISIT US AGAIN!!!
        </div>
      </Card.Body>
    </Card>
    </div>
    <ReceiptPreviewModal
      show={showPreview}
      onHide={() => setShowPreview(false)}
      imgData={previewData.imgData}
      whatsappLink={previewData.whatsappLink}
    />
   </>
  );
}
