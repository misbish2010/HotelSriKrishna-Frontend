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
                    <Col sm={6}><strong>Name:</strong> {guestInfo.name}</Col>
                    <Col sm={6}><strong>ID:</strong> {guestInfo.idType} - {guestInfo.idNumber}</Col>
                  </Row>
                  <Row>
                    <Col sm={6}><strong>Phone:</strong> {guestInfo.phone}</Col>
                    <Col sm={6}><strong>Address:</strong> {guestInfo.address}</Col>
                  </Row>
                  <Row>
                    <Col sm={6}><strong>Email:</strong> {guestInfo.email}</Col>
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
              onClick={() => onRequestEdit("stayInfo")}
              //disabled
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
              disabled
            >
              Edit
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Room No.</th>
                  <th>Type</th>
                  <th>Occupancy</th>
                  <th>AC/Non-AC</th>
                  <th>Extra Person</th>
                  <th>Agreed/Night</th>
                  <th>Total for Stay</th>
                </tr>
              </thead>
              <tbody>
                {roomDetails.map((room, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{room.roomNumber}</td>
                    <td>{room.roomType}</td>
                    <td>{room.occupancy}</td>
                    <td>{room.isAcRoom ? "AC" : "Non-AC"}</td>
                    <td>{room.extraPersons}</td>
                    <td>₹{room.agreed}</td>
                    <td>₹{room.totalForStay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
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
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>₹{p.amount}</td>
                      <td>{p.date ? format(new Date(p.date), "dd MMM yyyy") : ""}</td>
                      <td>{p.mode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
