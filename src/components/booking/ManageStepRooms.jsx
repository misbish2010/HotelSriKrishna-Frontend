// ManageStepRooms.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";

const ManageStepRooms = ({
  rooms = [],
  availableRooms = [],
  onRoomChange = () => {},
  disableRoomEditing = true,
  onAddRoom,
  onRemoveRoom,
  onUpdateRoom,
}) => {
  const roomTypeOccupancyMap = {
    Studio: ["Single", "Double"],
    Luxury: ["Single", "Double"],
    Triple: ["Triple"],
  };
  const [previousRooms, setPreviousRooms] = useState(rooms)
useEffect(() => {
  console.log("StepRooms received rooms:", rooms);
}, [rooms]);
  const handleChange = (e, index) => {
    if (disableRoomEditing) return;

    const { name, value } = e.target;
    let updatedRoom = { ...rooms[index], [name]: value };

    // Reset dependent fields when a parent changes
    if (name === "roomType") {
      updatedRoom.occupancy = "";
      updatedRoom.isAcRoom = "";
      updatedRoom.roomNumber = "";
      updatedRoom.roomId = "";
    } else if (name === "occupancy") {
      updatedRoom.isAcRoom = "";
      updatedRoom.roomNumber = "";
      updatedRoom.roomId = "";
    } else if (name === "isAcRoom") {
      updatedRoom.roomNumber = "";
      updatedRoom.roomId = "";
    } else if (name === "roomNumber") {
      const matchedRoom = filteredRoomOptions(index).find(
        (r) => r.room_number === value
      );
      if (matchedRoom) {
        updatedRoom.roomId = matchedRoom.room_id;
        updatedRoom.pricePerNight = matchedRoom.room_price;
        updatedRoom.extraBedPrice = matchedRoom.extra_bed_price;
        updatedRoom.agreedPrice = (matchedRoom.room_price * 1.05).toFixed(2); // ✅ include GST
        updatedRoom.isAcRoom = matchedRoom.is_ac ? "true" : "false";
        updatedRoom.roomType = matchedRoom.room_type;
        updatedRoom.occupancy = matchedRoom.occupancy;
      }
    }

    const updatedRooms = [...rooms];
    updatedRooms[index] = updatedRoom;
    onRoomChange(updatedRooms);

    if (onUpdateRoom) onUpdateRoom(index, updatedRoom);
  };


  const filteredRoomOptions = (index) => {
    const { roomType, occupancy, isAcRoom } = rooms[index];
    if (!roomType || !occupancy || isAcRoom === "") return [];

    return availableRooms.filter(
      (room) =>
        room.room_type === roomType &&
        room.occupancy === occupancy &&
        room.is_ac === (isAcRoom === "true")
    );
  };

  return (
    <div>
        <Card className="mb-3 p-3 shadow-sm" >
        {!disableRoomEditing && (
                      <Row className="mb-3">
                          <Col>
                            <strong>Previous Selection</strong>
                            {previousRooms.map((room, idx) => (
                              <div key={idx} className="mb-1">
                                Room {room.roomNumber} ({room.roomType}, {room.isAcRoom === "true" ? "AC" : "Non-AC"}) –
                                ₹{Number(room.pricePerNight).toFixed(2)}
                              </div>
                            ))}
                          </Col>
                          <Col>
                            <strong>New Selection</strong>
                            {rooms.map((room, idx) => (
                              <div key={idx} className="mb-1">
                                Room {room.roomNumber} ({room.roomType}, {room.isAcRoom === "true" ? "AC" : "Non-AC"}) –
                                ₹{Number(room.agreedPrice).toFixed(2)}
                              </div>
                            ))}
                          </Col>
                        </Row>
                    )}
        </Card>

      {rooms.map((room, index) => (
        <Card className="mb-3 p-3 shadow-sm" key={index}>
            <Row>
            {/* Room Type */}
            <Col md={3}>
              <Form.Group>
                <Form.Label>Room Type</Form.Label>
                <Form.Select
                  name="roomType"
                  value={room.roomType || ""}
                  onChange={(e) => handleChange(e, index)}
                  disabled={disableRoomEditing}
                  required
                >
                  <option value="">Select Room Type</option>
                  {Object.keys(roomTypeOccupancyMap).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Occupancy */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>Occupancy</Form.Label>
                <Form.Select
                  name="occupancy"
                  value={room.occupancy || ""}
                  onChange={(e) => handleChange(e, index)}
                  disabled={!room.roomType || disableRoomEditing}
                  required
                >
                  <option value="">Select Occupancy</option>
                  {roomTypeOccupancyMap[room.roomType]?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* AC / Non-AC */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>AC / Non-AC</Form.Label>
                <Form.Select
                  name="isAcRoom"
                  value={room.isAcRoom}
                  onChange={(e) => handleChange(e, index)}
                  disabled={!room.roomType || !room.occupancy || disableRoomEditing}
                  required
                >
                  <option value="">Select</option>
                  <option value="true">AC</option>
                  <option value="false">Non-AC</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Room Number */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>Room Number</Form.Label>
                <Form.Select
                  name="roomNumber"
                  value={room.roomNumber || ""}
                  onChange={(e) => handleChange(e, index)}
                  disabled={!filteredRoomOptions(index).length || disableRoomEditing}
                  required
                >
                  <option value="">Select Room</option>
                  {filteredRoomOptions(index).map((r) => (
                    <option key={r.room_id} value={r.room_number}>
                      {r.room_number}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Extra persons */}
            <Col md={1}>
              <Form.Group>
                <Form.Label>Extra</Form.Label>
                <Form.Control
                  type="number"
                  name="extraPersons"
                  value={room.extraPersons || 0}
                  onChange={(e) => handleChange(e, index)}
                  disabled={disableRoomEditing}
                />
              </Form.Group>
            </Col>

            {/* Agreed Price */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>Agreed Price/Night</Form.Label>
                <Form.Control
                  type="number"
                  name="agreedPrice"
                  value={
                    room.agreedPrice ??
                    ((room.pricePerNight ?? 0) * 1.05).toFixed(2)
                  }
                  onChange={(e) => handleChange(e, index)}
                  disabled={disableRoomEditing}
                />
              </Form.Group>
            </Col>
          </Row>

          {!disableRoomEditing && (
            <Row>
              <Col className="text-end mt-2">
                <Button variant="danger" size="sm" onClick={() => onRemoveRoom(index)}>
                  Remove Room
                </Button>
              </Col>
            </Row>
          )}
        </Card>
      ))}

      {!disableRoomEditing && (
        <div>
          <Button variant="primary" onClick={onAddRoom}>
            + Add Room
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManageStepRooms;
