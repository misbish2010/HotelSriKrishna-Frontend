// ManageStepReviewConfirm.jsx
import React from "react";
import { Card, Row, Col, ListGroup, Button } from "react-bootstrap";
import { format } from "date-fns";

const ManageStepReviewConfirm = ({
  formData = {},
  bookingStatus = "",
  onRequestEdit = () => {},
}) => {
  const { guestInfo = {}, stayInfo = {}, rooms = [], payments = [] } = formData;
  const nights = stayInfo?.duration || 1;
  console.log(stayInfo)
  // Determine editability based on booking status
  const status = (bookingStatus || "").toLowerCase();
  const isFinal =
    status.includes("checked out") ||
    status.includes("cancel") ||
    status.includes("cancelled");

  const canEditGuest = !isFinal;
  const canEditStay = !isFinal;
  const canEditRooms =
    (status.includes("confirmed") ||
      status.includes("booked") ||
      status === "") &&
    !isFinal;
  const canEditPayment = !isFinal;

  // Room pricing from agreed prices (no GST recalculation here)
  const roomDetails = rooms.map((r) => {
    const base = Number(r.pricePerNight || r.price || 0);
    const extra = Number(
      r.extraCharges ?? (r.extraPersons || 0) * (r.extraBedPrice || 0)
    );
    const agreed = Number(
      r.agreedPrice ?? r.pricePerNight ?? r.price ?? 0
    );
    return {
      ...r,
      base,
      extra,
      agreed,
      totalForStay: agreed * nights,
    };
  });

  const totalPayable = roomDetails.reduce(
    (sum, r) => sum + (r.totalForStay || 0),
    0
  );

  return (
    <div>
      <h5 className="mb-3">Review & Confirm</h5>

      {/* Guest Info */}
      <Card className="mb-3">
        <Card.Header>
          Guest Information
          {canEditGuest && (
            <Button
              size="sm"
              variant="link"
              onClick={() => onRequestEdit("guestInfo")}
            >
              Edit
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col sm={4}>
              <strong>Name:</strong>
            </Col>
            <Col sm={8}>{guestInfo.name}</Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Phone:</strong>
            </Col>
            <Col sm={8}>{guestInfo.phone}</Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>ID:</strong>
            </Col>
            <Col sm={8}>
              {guestInfo.idType} - {guestInfo.idNumber}
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Email:</strong>
            </Col>
            <Col sm={8}>{guestInfo.email}</Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Address:</strong>
            </Col>
            <Col sm={8}>{guestInfo.address}</Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stay Info */}
      <Card className="mb-3">
        <Card.Header>
          Stay Information
          {canEditStay && (
            <Button
              size="sm"
              variant="link"
              //onClick={() => onRequestEdit("stayInfo")}
              disabled
            >
              Edit
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col sm={4}>
              <strong>Check-In:</strong>
            </Col>
            <Col sm={8}>
              {stayInfo.checkIn
                ? format(new Date(stayInfo.checkIn), "dd MMM yyyy hh:mm a")
                : "N/A"}
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Check-Out:</strong>
            </Col>
            <Col sm={8}>
              {stayInfo.checkOut
                ? format(new Date(stayInfo.checkOut), "dd MMM yyyy hh:mm a")
                : "N/A"}
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Adults:</strong>
            </Col>
            <Col sm={8}>{stayInfo.adults}</Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Children:</strong>
            </Col>
            <Col sm={8}>{stayInfo.children}</Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Booking Mode:</strong>
            </Col>
            <Col sm={8}>{stayInfo.bookingMode}</Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Room Details */}
      <Card className="mb-3">
        <Card.Header>
          Room Details
          {canEditRooms && (
            <Button
              size="sm"
              variant="link"
              //onClick={() => onRequestEdit("rooms")}
              disabled
            >
              Edit
            </Button>
          )}
        </Card.Header>
        <ListGroup variant="flush">
          {roomDetails.map((room, idx) => (
            <ListGroup.Item key={idx}>
              <strong>Room-{idx + 1}</strong>: {room.roomNumber} |{" "}
              {room.roomType} | {room.occupancy} |{" "}
              {room.isAcRoom ? "AC" : "Non-AC"}
              <br />
              Base: ₹{room.base} | Extra: ₹{room.extra} | Agreed/Night: ₹
              {room.agreed} | Total for stay: ₹
              {room.totalForStay.toFixed(2)}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>

      {/* Payment Details */}
      <Card className="mb-3">
        <Card.Header>
          Payment Details
          {canEditPayment && (
            <Button
              size="sm"
              variant="link"
              onClick={() => onRequestEdit("payments")}
            >
              Edit
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {payments.length > 0 ? (
            payments.map((p, idx) => (
              <div key={idx} className="mb-2">
                <Row>
                  <Col sm={4}>
                    <strong>Amount:</strong>
                  </Col>
                  <Col sm={8}>₹{p.amount}</Col>
                </Row>
                <Row>
                  <Col sm={4}>
                    <strong>Date:</strong>
                  </Col>
                  <Col sm={8}>
                    {p.date ? format(new Date(p.date), "dd MMM yyyy") : ""}
                  </Col>
                </Row>
                <Row>
                  <Col sm={4}>
                    <strong>Mode:</strong>
                  </Col>
                  <Col sm={8}>{p.mode}</Col>
                </Row>
                <hr />
              </div>
            ))
          ) : (
            <p>No payments recorded</p>
          )}
          <Row className="mt-3">
            <Col sm={4}>
              <strong>Total Payable:</strong>
            </Col>
            <Col sm={8}>
              <span className="fw-bold text-success">
                ₹{totalPayable.toFixed(2)}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ManageStepReviewConfirm;
