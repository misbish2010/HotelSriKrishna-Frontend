import React, { useState } from "react";
import { Button, Card, Form, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { searchBooking } from "../../api";
import { toast } from "react-toastify";

const BookingSearchPage = ({ onBookingFound }) => {
  const [searchInput, setSearchInput] = useState({
    bookingId: "",
    phoneNumber: "",
    roomNumber: "",
    selectDate: null,
  });

  const [loading, setLoading] = useState(false);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setSearchInput((prev) => ({
      ...prev,
      selectDate: date,
    }));
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();

    const { bookingId, phoneNumber, roomNumber, selectDate } = searchInput;

    if (!bookingId && !phoneNumber && !roomNumber) {
      toast.warn("Please enter Booking ID, Phone Number, or Room + Date to search.");
      return;
    }

    const formattedDate = selectDate
      ? new Date(selectDate).toISOString().split("T")[0]
      : null;

    try {
      setLoading(true);
      const result = await searchBooking({
        bookingId,
        phoneNumber,
        roomNumber,
        checkInDate: formattedDate,
      });

      if (result && result.bookingDetails) {
        onBookingFound(result.bookingDetails[0]);


      } else {
        toast.error("No matching booking found.");
      }
    } catch (error) {
      toast.error("Error fetching booking. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isBookingIdFilled = !!searchInput.bookingId;
  const isPhoneFilled = !!searchInput.phoneNumber;

  return (
    <Form onSubmit={handleSearchSubmit}>
      <Card className="mb-3">
        <Card.Header>🔎 Search Booking</Card.Header>
        <Card.Body>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Booking ID</Form.Label>
            <Col sm={4}>
              <Form.Control
                type="text"
                name="bookingId"
                value={searchInput.bookingId}
                onChange={handleSearchChange}
                disabled={isPhoneFilled}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Phone Number</Form.Label>
            <Col sm={4}>
              <Form.Control
                type="text"
                name="phoneNumber"
                value={searchInput.phoneNumber}
                onChange={handleSearchChange}
                disabled={isBookingIdFilled}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Room Number</Form.Label>
            <Col sm={4}>
              <Form.Control
                type="text"
                name="roomNumber"
                value={searchInput.roomNumber}
                onChange={handleSearchChange}
                disabled={isBookingIdFilled || isPhoneFilled}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Check-In Date</Form.Label>
            <Col sm={8}>
              <DatePicker
                selected={searchInput.selectDate}
                onChange={handleDateChange}
                className="form-control"
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date"
                disabled={isBookingIdFilled || isPhoneFilled}
              />
            </Col>
          </Form.Group>

          <Button
            type="submit"
            className="mx-auto d-block mt-3"
            disabled={
              (!searchInput.bookingId &&
                !searchInput.phoneNumber &&
                !(searchInput.roomNumber && searchInput.selectDate)) || loading
            }
          >
            {loading ? "Searching..." : "Search Booking"}
          </Button>
        </Card.Body>
      </Card>
    </Form>
  );
};

export default BookingSearchPage;
