// ManageStepRooms.jsx
import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";

const ManageStepRooms = ({ rooms = [], onRoomChange = () => {}, disableRoomEditing = true, onAddRoom, onRemoveRoom, onUpdateRoom }) => {
  const handleFieldChange = (index, field, value) => {
    if (disableRoomEditing) return;
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    onRoomChange(updated);
    if (onUpdateRoom) onUpdateRoom(index, { [field]: value });
  };

  const addRoom = () => { if (onAddRoom) onAddRoom(); else onRoomChange([...rooms, { roomNumber: "", roomType: "", isAcRoom: false, extraPersons: 0, occupancy: "", pricePerNight: 0, extraBedPrice: 0, agreedPrice: 0 }]); };

  const removeRoom = (i) => { if (onRemoveRoom) onRemoveRoom(i); else onRoomChange(rooms.filter((_, idx) => idx !== i)); };

  return (
    <div>
      {rooms.map((room, idx) => (
        <Card className="mb-3 p-3" key={idx}>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Room Type</Form.Label>
                <Form.Control value={room.roomType || ""} onChange={(e) => handleFieldChange(idx, "roomType", e.target.value)} readOnly={disableRoomEditing} />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Occupancy</Form.Label>
                <Form.Control value={room.occupancy || ""} onChange={(e) => handleFieldChange(idx, "occupancy", e.target.value)} readOnly={disableRoomEditing} />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>AC / Non AC</Form.Label>
                <Form.Control value={room.isAcRoom ? "AC" : "Non AC"} readOnly />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Room Number</Form.Label>
                <Form.Control value={room.roomNumber || ""} onChange={(e) => handleFieldChange(idx, "roomNumber", e.target.value)} readOnly={disableRoomEditing} />
              </Form.Group>
            </Col>

            <Col md={1}>
              <Form.Group>
                <Form.Label>Extra</Form.Label>
                <Form.Control type="number" value={room.extraPersons || 0} onChange={(e) => handleFieldChange(idx, "extraPersons", Number(e.target.value))} readOnly={disableRoomEditing} />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Agreed Price/Night</Form.Label>
                <Form.Control type="number" value={room.agreedPrice ?? room.pricePerNight ?? 0} onChange={(e) => handleFieldChange(idx, "agreedPrice", Number(e.target.value))} readOnly={disableRoomEditing} />
              </Form.Group>
            </Col>

            {!disableRoomEditing && (
              <Col md={12} className="mt-2 text-end">
                <Button variant="danger" size="sm" onClick={() => removeRoom(idx)}>Remove Room</Button>
              </Col>
            )}
          </Row>
        </Card>
      ))}

      {!disableRoomEditing && (
        <div>
          <Button variant="primary" onClick={addRoom}>Add Another Room</Button>
        </div>
      )}
    </div>
  );
};

export default ManageStepRooms;
