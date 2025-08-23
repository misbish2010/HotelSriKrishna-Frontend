// ManageStepGuestInfo.jsx
import React from "react";
import { Form, Row, Col } from "react-bootstrap";

const ManageStepGuestInfo = ({ guestInfo = {}, onChange = () => {}, onPhoneBlur, disableGuestEditing = true }) => {
  const handleChange = (e) => {
    if (disableGuestEditing) return;
    const { name, value } = e.target;
    onChange({ ...guestInfo, [name]: value });
  };

  return (
    <div>
      <h5 className="mb-3">Guest Information</h5>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Name</Form.Label>
        <Col sm={9}>
          <Form.Control name="name" value={guestInfo.name || ""} onChange={handleChange} readOnly={disableGuestEditing} />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Phone</Form.Label>
        <Col sm={9}>
          <Form.Control name="phone" value={guestInfo.phone || ""} onChange={handleChange} onBlur={!disableGuestEditing ? onPhoneBlur : undefined} readOnly={disableGuestEditing} />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>ID Type</Form.Label>
        <Col sm={9}>
          <Form.Control as="select" name="idType" value={guestInfo.idType || ""} onChange={handleChange} disabled={disableGuestEditing}>
            <option value="">Select</option>
            <option value="AADHAR">AADHAR</option>
            <option value="PAN">PAN</option>
            <option value="VOTER">VOTER</option>
            <option value="PASSPORT">PASSPORT</option>
          </Form.Control>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>ID Number</Form.Label>
        <Col sm={9}>
          <Form.Control name="idNumber" value={guestInfo.idNumber || ""} onChange={handleChange} readOnly={disableGuestEditing} />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Email</Form.Label>
        <Col sm={9}>
          <Form.Control type="email" name="email" value={guestInfo.email || ""} onChange={handleChange} readOnly={disableGuestEditing} />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={3}>Address</Form.Label>
        <Col sm={9}>
          <Form.Control as="textarea" name="address" value={guestInfo.address || ""} onChange={handleChange} rows={2} readOnly={disableGuestEditing} />
        </Col>
      </Form.Group>
    </div>
  );
};

export default ManageStepGuestInfo;
