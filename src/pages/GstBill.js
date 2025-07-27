import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import "./GstBill.css";
import { searchBooking, fetchGSTDetails } from "../api";
import { format } from "date-fns";

function GstBill() {
    const [searchInput, setSearchInput] = useState({
        bookingId: "",
        phoneNumber: "",
    });
    const [formData, setFormData] = useState({
        personal_info: {
            name: "",
            phoneNumber: "",
            identity: "",
            address: "",
            email: "",
            gstNumber: "",
            companyName: ""
        },
        stay_info: {
            checkInDateTime: "",
            checkOutDateTime: "",
            durationOfStay: 1,
            bookingMode: "",
            bookingStatus: "",
            bookingId: "",
            gstBillNo: "",
        },
        rooms: [],
        finalPricePerNight: "",
        totalPrice: "",
    });
    const [isPrinting, setIsPrinting] = useState(false);
    const [editingGst, setEditingGst] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [error, setError] = useState("");
    const [gstCharges, setGstCharges] = useState(0);
    const [stayCharges, setStayCharges] = useState(0);
    const charges = { gstRate: 0.12 };

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

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchInput({ ...searchInput, [name]: value });
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchInput.bookingId && !searchInput.phoneNumber) {
            setError("Please enter at least one search field.");
            return;
        }
        try {
            const data = await searchBooking({ ...searchInput, bookingStatus: "PAST" });
            const initialData = data.bookingDetails[0];
            const roomsData = initialData.room_details.map((room) => ({
                roomType: room.room_type,
                roomNumber: room.room_number,
                isAcRoom: room.is_ac,
                occupancy: room.occupancy || "",
                extraPersons: room.extra_persons || 0,
            }));

            const total_price_of_stay = initialData.stay_info.duration * initialData.price_per_night
            const actualCharges = total_price_of_stay * (1/(1+charges.gstRate))
            const gstAmount =  actualCharges * (charges.gstRate) ;
            setGstCharges(gstAmount);
            setStayCharges(actualCharges);

            setFormData({
                personal_info: {
                    name: initialData.customer_info.name,
                    phoneNumber: initialData.customer_info.phone,
                    identity: initialData.customer_info.identity,
                    address: initialData.customer_info.address,
                    email: initialData.customer_info.email,
                    gstNumber: initialData.gst_info.guest_gst_no || "",
                },
                stay_info: {
                    checkInDateTime: formatDate(initialData.stay_info.check_in_date),
                    checkOutDateTime: formatDate(initialData.stay_info.check_out_date),
                    durationOfStay: initialData.stay_info.duration,
                    bookingMode: initialData.booking_mode,
                    bookingStatus: initialData.booking_status,
                    bookingId: initialData.booking_id,
                    gstBillNo: initialData.gst_info.gst_bill_no || "",
                },
                rooms: roomsData,
                finalPricePerNight: initialData.price_per_night || "",
                totalPrice: initialData.price_per_night * initialData.stay_info.duration || "",
            });

            setBookingDetails(data.bookingDetails);
            setError("");
        } catch (err) {
            console.error(err);
            setError("No booking found or an error occurred.");
        }
    };

    const handleConfirmGst = async () => {
        try {
            const { gstNumber, companyName } = formData.personal_info;
            const { bookingId } = formData.stay_info;

            if (!gstNumber || !companyName) {
                alert("Please enter both Company Name and GSTIN");
                return;
            }

            const data = await fetchGSTDetails(bookingId, gstNumber, companyName);
            const gstBillNo = data.gstDetails?.[0]?.gst_bill_no || "";
            const gstNumberUpdated = data.gstDetails?.[0]?.guest_gst_no || gstNumber;

            setFormData((prevData) => ({
                ...prevData,
                stay_info: { ...prevData.stay_info, gstBillNo },
                personal_info: {
                    ...prevData.personal_info,
                    gstNumber: gstNumberUpdated,
                    companyName: companyName,
                },
            }));
            setEditingGst(false);
        } catch (err) {
            console.error("Error confirming GST:", err);
            alert("Failed to fetch GST details. Please try again.");
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            personal_info: { ...prevData.personal_info, [name]: value },
        }));
    };

    const handleEditGst = () => setEditingGst(true);

    const handlePrint = () => window.print();

    return (
        <div>
            {!bookingDetails ? (
                <Form onSubmit={handleSearchSubmit}>
                    <Card className="mb-3">
                        <Card.Header>Booking Search</Card.Header>
                        <Card.Body>
                            {error && <p className="text-danger">{error}</p>}
                            <Form.Group as={Row} controlId="formBookingId">
                                <Form.Label column sm="4">Booking ID</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="text"
                                        name="bookingId"
                                        value={searchInput.bookingId}
                                        onChange={handleSearchChange}
                                        placeholder="Enter Booking ID"
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formPhoneNumber">
                                <Form.Label column sm="4">Phone Number</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="text"
                                        name="phoneNumber"
                                        value={searchInput.phoneNumber}
                                        onChange={handleSearchChange}
                                        placeholder="Enter Phone Number"
                                    />
                                </Col>
                            </Form.Group>

                           <Button type="submit" className="mx-auto d-block">Search Booking</Button>
                        </Card.Body>
                    </Card>
                </Form>
            ) : (
        <div className="gst-bill">
            <div style={styles.billHeader}>
                  <div style={styles.billDetails}>
                    <h1 style={styles.hotelName}>{hotelDetails.name}</h1>
                    <p style={styles.detailText}>{hotelDetails.address}</p>
                    <p style={styles.detailText}>Contact No: {hotelDetails.contactNumber}</p>
                    <p style={styles.detailText}>GSTIN: {hotelDetails.gstNumber}</p>
                    <p style={styles.detailText}>Bill No: {formData.stay_info.gstBillNo}</p>
                  </div>
                  <div style={styles.billLogo}>
                    <img
                      src={hotelDetails.logoUrl}
                      alt="Hotel Logo"
                      style={styles.logoImage}
                    />
                  </div>
                </div>

            <hr />

            <div className="guest-details-container">
                {/* Guest Details Card */}
                <div className="guest-card">
                    <h3>Guest Details</h3>
                    <div className="guest-info">
                        <p><strong>Guest Name:</strong> {formData.personal_info.name}</p>
                        <p><strong>Address:</strong> {formData.personal_info.address}</p>
                        <p><strong>Phone Number:</strong> {formData.personal_info.phoneNumber}</p>
                        <p><strong>Aadhar:</strong> {formData.personal_info.identity}</p>
<Form.Group as={Row} controlId="billingCompanyName">
    <Form.Label column sm="4"><strong>Billing To (Company Name):</strong></Form.Label>
    <Col sm="8">
        {formData.stay_info.gstBillNo && !editingGst ? (
            <p>{formData.personal_info.companyName}</p>
        ) : (
            <Form.Control
                type="text"
                name="companyName"
                value={formData.personal_info.companyName || ''}
                onChange={handleInputChange}
                placeholder="Enter Company Name"
            />
        )}
    </Col>
</Form.Group>

<Form.Group as={Row} controlId="guestGstNo">
    <Form.Label column sm="4"><strong>GSTIN:</strong></Form.Label>
    <Col sm="8">
        {formData.stay_info.gstBillNo && !editingGst ? (
            <div className="d-flex justify-content-between align-items-center">
                <p className="mb-0">{formData.personal_info.gstNumber}</p>
                <Button
                    variant="link"
                    size="sm"
                    onClick={handleEditGst}
                    className="no-print"
                    style={{ padding: 0, textDecoration: 'underline' }}
                >
                    Edit
                </Button>
            </div>
        ) : (
            <div className="d-flex gap-2 flex-column flex-sm-row">
                <Form.Control
                    type="text"
                    name="gstNumber"
                    value={formData.personal_info.gstNumber || ''}
                    onChange={handleInputChange}
                    placeholder="Enter GST Number"
                />
                <Button
                    className="confirm-button"
                    variant="primary"
                    type="button"
                    onClick={handleConfirmGst}
                    disabled={
                        !formData.personal_info.gstNumber ||
                        !formData.personal_info.companyName
                    }
                >
                    Confirm
                </Button>
            </div>
        )}
    </Col>
</Form.Group>

                      </div>
                </div>



                {/* Stay Details Card */}
                <div className="stay-card">
                    <h3>Stay Details</h3>
                    <div className="stay-info">
                        <p><strong>Check-In Date:</strong> {formData.stay_info.checkInDateTime}</p>
                        <p><strong>Check-Out Date:</strong> {formData.stay_info.checkOutDateTime}</p>
                        <p><strong>Duration:</strong> {formData.stay_info.durationOfStay} Nights</p>
                        {formData.rooms.map((room, index) => (
                        <p><strong>Room-{index + 1} </strong>{room.occupancy} occupancy {room.roomType} room #{room.roomNumber} ({room.is_ac ? "AC" : "Non-AC"})</p>
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
                            <td>{formData.stay_info.durationOfStay} Nights</td>
                            <td>₹{(stayCharges / formData.stay_info.durationOfStay).toFixed(2)}</td>
                            <td>₹{stayCharges.toFixed(2)}</td>
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
                            <td>₹{stayCharges.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>GST ({charges.gstRate * 100}%)</td>
                            <td colSpan="2"></td>
                            <td>₹{gstCharges.toFixed(2)}</td>
                        </tr>
                        <tr className="total-row">
                            <td><strong>Grand Total</strong></td>
                            <td colSpan="2"></td>
                            <td><strong>₹{formData.totalPrice.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Signature Section */}

                    <div className="signature-container">
                      {/* Manager Signature */}
                       {/* Manager Signature */}
                      <div className="signature-box">
                        <img
                          src={`${process.env.PUBLIC_URL}/static/images/signature.jpg`}
                          alt="Manager Signature"
                          className="signature-img"
                        />
                        <img
                          src={`${process.env.PUBLIC_URL}/static/images/hotel-stamp.png`}
                          alt="Hotel Sri Krishna Stamp"
                          className="stamp-img"
                        />
                        <p className="signature-label">Manager Signature</p>
                      </div>

                      {/* Guest Signature */}
                      <div className="signature-box">
                        <p className="signature-label">Guest Signature</p>
                      </div>
                    </div>


            <div className="print-button">
                <Button  onClick={handlePrint}>Print Bill</Button>
            </div>
        </div>
            )}
        </div>
    );
}

export default GstBill;

