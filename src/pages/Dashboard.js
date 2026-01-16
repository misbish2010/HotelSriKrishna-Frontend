import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import "./Dashboard.css";

function Dashboard({ onNavigate }) {
  return (
    <Container fluid className="dashboard py-3">

      {/* ===== BOOKINGS ===== */}
      <h6 className="section-title">Bookings</h6>
      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("checkin")}>
            ➕ Check-in
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("advance_booking")}>
            📅 Advance Booking
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("bookingSearch")}>
            🔍 Manage Booking
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("booking_dashboard")}>
            🚪 Booking Dashboard
          </Button>
        </Col>
      </Row>

      {/* ===== ROOMS ===== */}
      <h6 className="section-title">Rooms</h6>
      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("rooms_time_based")}>
            🟢 Live Status
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("rooms_daily_chart")}>
            📊 Daily Chart
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("rooms_daily_grid")}>
            📊 Daily Grid
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("rooms_multi_night")}>
            🗓 Stay Planner
          </Button>
        </Col>
      </Row>

      {/* ===== BILLING ===== */}
      <h6 className="section-title">Billing & Reports</h6>
      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("collection")}>
            💰 Payment Dashboard
          </Button>
        </Col>

        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("invoice_report")}>
            🧾 GST Reports
          </Button>
        </Col>
      </Row>

      {/* ===== OPERATIONS ===== */}
      <h6 className="section-title">Operations</h6>
      <Row className="g-3">
        <Col xs={6} md={3}>
          <Button className="dashboard-btn" onClick={() => onNavigate("dailyExpense")}>
            📒 Expenses
          </Button>
        </Col>
      </Row>

    </Container>
  );
}

export default Dashboard;
