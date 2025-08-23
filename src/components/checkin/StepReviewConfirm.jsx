import React from "react";
import { Card, Row, Col, ListGroup } from "react-bootstrap";
import { format } from "date-fns";

const StepReviewConfirm = ({ formData }) => {
  const { guestInfo, stayInfo, rooms, payment } = formData;
  const nights = stayInfo?.duration || 1;
  const gstRate = 12;

  // Compute per-room totals from agreed prices in payment step
  const roomDetails = rooms.map((room) => {
    const base = Number(room.pricePerNight || room.price || 0);
    const extra = Number(room.extraCharges != null
      ? room.extraCharges
      : (room.extraPersons || 0) * (room.extraBedPrice || 300)
    );
    const gstAmount = ((base + extra) * gstRate) / 100;
    const totalWithGst = base + extra + gstAmount;

    const agreed = Number(
      room.agreedPrice != null
        ? room.agreedPrice
        : payment?.roomAgreedPrices?.find(r => r.roomId === room.roomId)?.agreedPrice
    ) || totalWithGst;

    return {
      ...room,
      base,
      extra,
      gstAmount,
      totalWithGst,
      agreed,
      totalForStay: agreed * nights
    };
  });

  const totalPayable = roomDetails.reduce((sum, r) => sum + r.totalForStay, 0);

  // For "Final Price/Night" display
  const uniqueAgreedPrices = Array.from(new Set(roomDetails.map(r => r.agreed)));
  const finalPricePerNightDisplay =
    uniqueAgreedPrices.length === 1
      ? `₹${uniqueAgreedPrices[0]}`
      : "varies (see above)";

  return (
    <>
      <h5 className="mb-3">Review and Confirm</h5>

      <Card className="mb-3">
        <Card.Header>Guest Information</Card.Header>
        <Card.Body>
          <Row>
            <Col sm={4}><strong>Name:</strong></Col>
            <Col sm={8}>{guestInfo.name}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Phone:</strong></Col>
            <Col sm={8}>{guestInfo.phone}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>ID:</strong></Col>
            <Col sm={8}>{guestInfo.idType} - {guestInfo.idNumber}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Email:</strong></Col>
            <Col sm={8}>{guestInfo.email}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Address:</strong></Col>
            <Col sm={8}>{guestInfo.address}</Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Stay Information</Card.Header>
        <Card.Body>
          <Row>
            <Col sm={4}><strong>Check-In:</strong></Col>
            <Col sm={8}>
              {stayInfo.checkIn
                ? format(new Date(stayInfo.checkIn), "dd MMM yyyy hh:mm a")
                : "N/A"}
            </Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Check-Out:</strong></Col>
            <Col sm={8}>
              {stayInfo.checkOut
                ? format(new Date(stayInfo.checkOut), "dd MMM yyyy hh:mm a")
                : ""}
            </Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Adults:</strong></Col>
            <Col sm={8}>{stayInfo.adults}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Children:</strong></Col>
            <Col sm={8}>{stayInfo.children}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Booking Mode:</strong></Col>
            <Col sm={8}>{stayInfo.bookingMode}</Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>Room Details</Card.Header>
        <ListGroup variant="flush">
          {roomDetails.map((room, index) => (
            <ListGroup.Item key={index}>
              <strong>Room-{index + 1}</strong>: {room.roomNumber} | {room.roomType} | {room.occupancy} | {room.isAcRoom === "true" || room.isAcRoom === true ? "AC" : "Non-AC"}
              <br />
              Base: ₹{room.base} | Extra: ₹{room.extra} | GST: ₹{room.gstAmount.toFixed(2)} | Total/Night: ₹{room.totalWithGst.toFixed(2)} | Agreed/Night: ₹{room.agreed}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>

      <Card className="mb-3">
        <Card.Header>Payment Summary</Card.Header>
        <Card.Body>
          <Row>
            <Col sm={4}><strong>Final Price/Night:</strong></Col>
            <Col sm={8}>{finalPricePerNightDisplay}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Paid Amount:</strong></Col>
            <Col sm={8}>₹{payment.paymentAmount}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Payment Mode:</strong></Col>
            <Col sm={8}>{payment.paymentMode}</Col>
          </Row>
          <Row>
            <Col sm={4}><strong>Payment Date:</strong></Col>
            <Col sm={8}>
              {payment.paymentDate
                ? format(new Date(payment.paymentDate), "dd MMM yyyy hh:mm a")
                : ""}
            </Col>
          </Row>
          <Row className="mt-3">
            <Col sm={4}><strong>Total Payable:</strong></Col>
            <Col sm={8}>
              <span className="text-success fw-bold">₹{totalPayable.toFixed(2)}</span>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default StepReviewConfirm;
