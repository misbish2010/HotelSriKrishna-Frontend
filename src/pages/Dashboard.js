import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import './Dashboard.css';

function Dashboard() {
    return (
        <Container className="dashboard py-4">
            {
            // <h2 className="text-center mb-4">Hotel Management Dashboard</h2>
            }
            <Row className="g-4" >
                             <Col xs={6} md={2}>
                                <Card className="text-center">
                                    <Button variant="primary" className="dashboard-btn">Check-in</Button>
                                </Card>
                            </Col>
                            <Col xs={6} md={2}>
                                <Card className="text-center">
                                    <Button variant="primary" className="dashboard-btn">Check-out</Button>
                                </Card>
                            </Col>

                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Check-in</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Check-out</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Advance Booking</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Show Booking</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Cancel Booking</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Modify Booking</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Expense</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Billing</Button>
                    </Card>
                </Col>
                <Col xs={6} md={2}>
                    <Card className="text-center">
                        <Button variant="primary" className="dashboard-btn">Room Availability</Button>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Dashboard;
