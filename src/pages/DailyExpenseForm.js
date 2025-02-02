import React, { useState } from 'react';
import { Form, Button, Card, Col, Row } from 'react-bootstrap';
import axios from 'axios'

function DailyExpenseForm() {
    const [expenseData, setExpenseData] = useState({
        amount: '',
        mode: '',
        description: '',
        date: new Date().toISOString().slice(0, 10), // auto-populates with current date
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExpenseData({
            ...expenseData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Expense Data Submitted: ", expenseData);
        // Here you can add logic to send data to a backend or another processing function
        try {
             // Replace with your Flask backend URL
             const response = await axios.post('http://127.0.0.1:5000/api/add_expense', expenseData);
             setMessage(response.data.message);
             // Clear form fields
             setExpenseData({
                             amount: '',
                             mode: '',
                             description: '',
                             date: '',
                         });
        } catch (error) {
             console.error("There was an error adding the expense!", error);
             const errorMessage = error.response?.data?.message || "Error adding expense";
             setMessage(errorMessage);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Card className="mb-3">
                <Card.Header>Daily Expense Entry</Card.Header>
                <Card.Body>
                    <Form.Group as={Row} controlId="formAmount">
                        <Form.Label column sm="4">Amount</Form.Label>
                        <Col sm="8">
                            <Form.Control
                                type="number"
                                name="amount"
                                value={expenseData.amount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formMode">
                        <Form.Label column sm="4">Mode of Payment</Form.Label>
                        <Col sm="8">
                            <Form.Control
                                as="select"
                                name="mode"
                                value={expenseData.mode}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select mode</option>
                                <option value="Cash">Cash</option>
                                <option value="UPI">Credit Card</option>
                                <option value="Online Payment">Online Payment</option>
                            </Form.Control>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formDescription">
                        <Form.Label column sm="4">Description</Form.Label>
                        <Col sm="8">
                            <Form.Control
                                type="text"
                                name="description"
                                value={expenseData.description}
                                onChange={handleChange}
                                placeholder="Enter description"
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formDate">
                        <Form.Label column sm="4">Date</Form.Label>
                        <Col sm="8">
                            <Form.Control
                                type="date"
                                name="date"
                                value={expenseData.date}
                                onChange={handleChange}
                                required
                            />
                        </Col>
                    </Form.Group>
                    {message && <p>{message}</p>}
                    <Button variant="primary" type="submit" className="mx-auto d-block">Submit Expense</Button>
                </Card.Body>
            </Card>
        </Form>

    );
}

export default DailyExpenseForm;
