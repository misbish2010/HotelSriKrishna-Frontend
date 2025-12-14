import React from "react";
import { Form, Row, Col, Button, Card } from "react-bootstrap";

const StepRooms = ({
  rooms,
  availableRooms,
  onRoomChange,
  onAddRoom,
  onRemoveRoom,
}) => {
  const roomTypeOccupancyMap = {
    Studio: ["Single", "Double"],
    Luxury: ["Single", "Double"],
    Triple: ["Triple"],
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;

    let updatedRoom = { ...rooms[index], [name]: value };

    // Reset dependent fields
    if (name === "roomType") {
      updatedRoom.occupancy = "";
      updatedRoom.isAcRoom = "" ;
      updatedRoom.roomNumber = "";
      updatedRoom.roomId = "";
    } else if (name === "occupancy") {
      updatedRoom.isAcRoom = "" ;
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
        updatedRoom.price = matchedRoom.room_price;
        updatedRoom.extraBedPrice = matchedRoom.extra_bed_price;
        updatedRoom.isAcRoom = matchedRoom.is_ac;
      }
    }

    const updatedRooms = [...rooms];
    updatedRooms[index] = updatedRoom;
    onRoomChange(updatedRooms);
  };


  const filteredRoomOptions = (index) => {
    const { roomType, occupancy, isAcRoom } = rooms[index];
    if (!roomType || !occupancy || isAcRoom === "") return [];

    return availableRooms.filter(
      (room) =>
        room.room_type === roomType &&
        room.occupancy === occupancy &&
        room.is_ac === (isAcRoom === "true" || isAcRoom === true)
    );
  };

  return (
    <>
      <h5 className="mb-3">Room Information</h5>

      {rooms.map((room, index) => (
        <Card className="mb-3" key={index}>
          <Card.Header>
            Room-{index + 1}:{" "}
            {room.roomNumber
              ? `${room.occupancy} ${room.roomType} #${room.roomNumber} (${room.isAcRoom ? "AC" : "Non-AC"})`
              : "(No Room Selected)"}
          </Card.Header>
          <Card.Body>
            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm={3}>Room Type</Form.Label>
              <Col sm={9}>
                <Form.Select
                  name="roomType"
                  value={room.roomType}
                  onChange={(e) => handleChange(e, index)}
                  required
                >
                  <option value="">Select Room Type</option>
                  {Object.keys(roomTypeOccupancyMap).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm={3}>Occupancy</Form.Label>
              <Col sm={9}>
                <Form.Select
                  name="occupancy"
                  value={room.occupancy}
                  onChange={(e) => handleChange(e, index)}
                  disabled={!room.roomType}
                  required
                >
                  <option value="">Select Occupancy</option>
                  {roomTypeOccupancyMap[room.roomType]?.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm={3}>AC/Non-AC</Form.Label>
              <Col sm={9}>
                <Form.Select
                  name="isAcRoom"
                  value={room.isAcRoom}
                  onChange={(e) => handleChange(e, index)}
                  disabled={!room.roomType || !room.occupancy}
                  required
                >
                  <option value="">Select</option>
                  <option value="true">AC</option>
                  <option value="false">Non-AC</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-2">
              <Form.Label column sm={3}>Room Number</Form.Label>
              <Col sm={9}>
                <Form.Select
                  name="roomNumber"
                  value={room.roomNumber || ""}
                  onChange={(e) => handleChange(e, index)}
                  disabled={!filteredRoomOptions(index).length}
                  required
                >
                  <option value="">Select Room Number</option>
                  {filteredRoomOptions(index).map((r) => (
                                        <option key={r.room_id} value={r.room_number}>
                                          {r.room_number}
                                        </option>

                  ))}
                </Form.Select>
              </Col>
            </Form.Group>

            {(room.occupancy === "Double" || room.occupancy === "Triple") && (
              <Form.Group as={Row} className="mb-2">
                <Form.Label column sm={3}>Extra Persons</Form.Label>
                <Col sm={9}>
                  <Form.Select
                    name="extraPersons"
                    value={room.extraPersons || 0}
                    onChange={(e) => handleChange(e, index)}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </Form.Select>
                </Col>
              </Form.Group>
            )}

            <Button
              variant="danger"
              onClick={() => onRemoveRoom(index)}
              className="mt-2"
            >
              Remove Room
            </Button>
          </Card.Body>
        </Card>
      ))}

      <Button variant="secondary" onClick={onAddRoom}>
        Add Room
      </Button>
    </>
  );
};

export default StepRooms;
