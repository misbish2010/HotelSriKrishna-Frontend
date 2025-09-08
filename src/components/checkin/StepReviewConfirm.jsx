import React from "react";
import { Row, Col, Card, Table } from "react-bootstrap";
import { format } from "date-fns";

const StepReviewConfirm = ({ formData }) => {
  const guest = formData.guestInfo || {};
  const stay = formData.stayInfo || {};
  const rooms = formData.rooms || [];
  const payment = formData.payment || {};

  return (
    <div>
      <h4>Review & Confirm</h4>

      {/* Guest Info */}
      <Card className="mb-3">
        <Card.Header>Guest Information</Card.Header>
        <Card.Body>
          <Row>
            <Col sm={6}><strong>Name:</strong> {guest.name}</Col>
            <Col sm={6}><strong>ID:</strong> {guest.idType} - {guest.idNumber}</Col>
          </Row>
          <Row>
            <Col sm={6}><strong>Phone:</strong> {guest.phone}</Col>
            <Col sm={6}><strong>Address:</strong> {guest.address}</Col>
          </Row>
          <Row>
            <Col sm={6}><strong>Email:</strong> {guest.email}</Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stay Info */}
      <Card className="mb-3">
        <Card.Header>Stay Information</Card.Header>
        <Card.Body>
          <Row>
            <Col sm={6}>
              <strong>Check-In:</strong>{" "}
              {stay.checkIn ? format(new Date(stay.checkIn), "dd MMM yyyy hh:mm a") : "N/A"}
            </Col>
            <Col sm={6}>
              <strong>Check-Out:</strong>{" "}
              {stay.checkOut ? format(new Date(stay.checkOut), "dd MMM yyyy hh:mm a") : "N/A"}
            </Col>
          </Row>
          <Row>
            <Col sm={6}><strong>Duration:</strong> {stay.duration} nights</Col>
            <Col sm={6}><strong>Mode:</strong> {stay.bookingMode}</Col>
          </Row>
        </Card.Body>
      </Card>

    {/* Rooms */}
    <Card className="mb-3">
      <Card.Header>Rooms</Card.Header>
      <Card.Body>
        <Table bordered hover size="sm">
          <thead>
            <tr>
              <th>Room #</th>
              <th>Type</th>
              <th>AC/Non-AC</th>
              <th>Occupancy</th>
              <th>Extra Persons</th>
              <th>Agreed Price/Night</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, idx) => {
              const agreed = payment?.pricing_info?.roomAgreedPrices?.find(
                (r) => r.roomId === room.roomId || r.roomId === room.id
              );
              return (
                <tr key={idx}>
                  <td>{room.roomNumber}</td>
                  <td>{room.roomType}</td>
                  <td>{room.isAcRoom === "true" ? "AC" : "Non-AC"}</td>
                  <td>{room.occupancy}</td>
                  <td>{room.extraPersons}</td>
                  <td>
                    ₹{agreed ? Number(agreed.agreedPrice).toFixed(2) : "0.00"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <Row>
          <Col className="text-end">
            <strong>
              Total (incl. GST): ₹
              {payment?.pricing_info?.totalPrice?.toFixed(2) || "0.00"}
            </strong>
          </Col>
        </Row>
      </Card.Body>
    </Card>


      {/* Payment Info */}
      <Card className="mb-3">
        <Card.Header>Payments</Card.Header>
        <Card.Body>
          <Table bordered hover size="sm">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payment?.payment_info?.length > 0 ? (
                payment.payment_info.map((p, idx) => (
                  <tr key={idx}>
                    <td>₹{p.amount}</td>
                    <td>{p.date}</td>
                    <td>{p.mode}</td>
                    <td>{p.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center">No payment recorded</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StepReviewConfirm;
