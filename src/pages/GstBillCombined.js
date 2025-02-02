import React, { useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./GstBill.css";
import { fetchBookingsInDateRange } from "../api";
import { format } from "date-fns";

function GstBillCombined() {
    const hotelDetails = {
        name: "Hotel Sri Krishna",
        address: "Koraput, Odisha, India 764020",
        gstNumber: "21AHSPM7680F1Z1",
        contactNumber: "06852-250372",
        logoUrl: process.env.PUBLIC_URL + "/static/images/logo.png",
    };

    const styles = {
        billHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #000",
            padding: "10px 20px",
            marginBottom: "20px",
        },
        billDetails: { textAlign: "left" },
        hotelName: { fontSize: "1.8rem", margin: "0", color: "#333" },
        detailText: { fontSize: "1rem", margin: "2px 0", color: "#555" },
        billLogo: { textAlign: "right" },
        logoImage: { maxWidth: "120px", maxHeight: "120px", borderRadius: "5px" },
    };

    const formatDate = (date) => {
        return format(new Date(date), "dd/MM/yyyy hh:mm a");
    };
    const charges = { gstRate: 0.12 };


    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: "",
    });
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange({ ...dateRange, [name]: value });
    };

    const fetchBookings = async () => {
        try {
            const response = await fetchBookingsInDateRange(dateRange);
            console.log(response)
            setBookings(response.bookings);
            setError("");
        } catch (err) {
            console.error(err);
            setError("No bookings found for the selected date range.");
        }
    };

const generateMergedPDF = async () => {
    if (bookings.length === 0) return;

    setIsGenerating(true);

    const pdf = new jsPDF("p", "mm", "a4"); // Standard A4 size
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pdfPromises = bookings.map(async (booking, index) => {
        const billElement = document.getElementById(`bill-${index}`);
        if (!billElement) {
            console.error(`Element with ID bill-${index} not found!`);
            return;
        }

        // Create canvas and render HTML element
        const canvas = await html2canvas(billElement, {
            scale: 2, // Increase resolution for better readability
            useCORS: true, // Handle cross-origin images
        });
        const imgData = canvas.toDataURL("image/png");

        // Calculate image dimensions to fit within PDF
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (index > 0) pdf.addPage(); // Add a new page for subsequent bills
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    });

    await Promise.all(pdfPromises);

    pdf.save("Merged-Bills.pdf");
    setIsGenerating(false);
};


    return (
        <div>
            <Card className="mb-3">
                <Card.Header>Fetch Bookings by Date Range</Card.Header>
                <Card.Body>
                    {error && <p className="text-danger">{error}</p>}
                    <Form.Group>
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                            type="date"
                            name="startDate"
                            value={dateRange.startDate}
                            onChange={handleDateChange}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                            type="date"
                            name="endDate"
                            value={dateRange.endDate}
                            onChange={handleDateChange}
                        />
                    </Form.Group>
                    <Button onClick={fetchBookings}>Fetch Bookings</Button>
                    {bookings.length > 0 && (
                        <Button
                            className="mt-3"
                            onClick={generateMergedPDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? "Generating PDF..." : "Download Merged PDF"}
                        </Button>
                    )}
                </Card.Body>
            </Card>

            {bookings.map((booking, index) => (
                <div key={index} id={`bill-${index}`} className="gst-bill">
                    <div style={styles.billHeader}>
                        <div style={styles.billDetails}>
                            <h1 style={styles.hotelName}>{hotelDetails.name}</h1>
                            <p style={styles.detailText}>{hotelDetails.address}</p>
                            <p style={styles.detailText}>Contact No: {hotelDetails.contactNumber}</p>
                            <p style={styles.detailText}>GSTIN: {hotelDetails.gstNumber}</p>
                            <p style={styles.detailText}>Bill No: {booking.gst_info.gst_bill_no}</p>
                        </div>
                        <div style={styles.billLogo}>
                            <img
                                src={hotelDetails.logoUrl}
                                alt="Hotel Logo"
                                style={styles.logoImage}
                            />
                        </div>
                    </div>
                    {/* Rest of the bill content */}
                    <hr />
                    <div className="guest-details-container">
                        {/* Guest Details Card */}
                        <div className="guest-card">
                            <h3>Guest Details</h3>
                            <div className="guest-info">
                                <p><strong>Guest Name:</strong> {booking.customer_info.name}</p>
                                <p><strong>Phone Number:</strong> {booking.customer_info.phone}</p>
                                {booking.customer_info.email && (
                                    <p><strong>Email:</strong> {booking.customer_info.email}</p>
                                )}
                                <p><strong>Aadhar:</strong> {booking.customer_info.identity}</p>
                                <p><strong>Address:</strong> {booking.customer_info.address}</p>
                                <p><strong>GSTIN:</strong> {booking.gst_info.guest_gst_no || ""}</p>
                            </div>
                        </div>
                        {/* Stay Details Card */}
                        <div className="stay-card">
                            <h3>Stay Details</h3>
                            <div className="stay-info">
                                <p><strong>Check-In Date:</strong> {formatDate(booking.stay_info.check_in_date)}</p>
                                <p><strong>Check-Out Date:</strong> {formatDate(booking.stay_info.check_out_date)}</p>
                                <p><strong>Duration:</strong> {booking.stay_info.duration} Nights</p>
                                {booking.room_details.map((room, idx) => (
                                    <p key={idx}>
                                        <strong>Room-{idx + 1} </strong>
                                        {room.occupancy} occupancy {room.room_type} room #{room.room_number} ({room.is_ac ? "AC" : "Non-AC"})
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div className="charges">
                        <h2>Billing Details</h2>
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Room Charges</td>
                                    <td>{booking.stay_info.duration} Nights</td>
                                    <td>₹{((booking.stay_info.duration * booking.price_per_night / (1 + charges.gstRate)) / booking.stay_info.duration).toFixed(2)}</td>
                                    <td>₹{(booking.stay_info.duration * booking.price_per_night / (1 + charges.gstRate)).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Extra Charges</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>₹0.00</td>
                                </tr>
                                <tr>
                                    <td>Subtotal</td>
                                    <td colSpan="2"></td>
                                    <td>₹{(booking.stay_info.duration * booking.price_per_night / (1 + charges.gstRate)).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>GST ({charges.gstRate * 100}%)</td>
                                    <td colSpan="2"></td>
                                    <td>₹{(booking.stay_info.duration * booking.price_per_night * charges.gstRate / (1 + charges.gstRate)).toFixed(2)}</td>
                                </tr>
                                <tr className="total-row">
                                    <td><strong>Grand Total</strong></td>
                                    <td colSpan="2"></td>
                                    <td><strong>₹{booking.stay_info.duration * booking.price_per_night.toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}




        </div>
    );
}

export default GstBillCombined;
