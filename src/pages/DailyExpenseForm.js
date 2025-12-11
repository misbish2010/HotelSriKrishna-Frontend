import React, { useState } from 'react';
import { Form, Button, Card, Col, Row } from 'react-bootstrap';
import { addExpense } from '../api'; // ⬅ NEW IMPORT

function DailyExpenseForm() {
    const [expenseData, setExpenseData] = useState({
        amount: '',
        mode: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
    });

    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExpenseData({ ...expenseData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Expense Data Submitted: ", expenseData);

        try {
            const data = await addExpense(expenseData);
            setMessage(data.message || "Expense added successfully!");

            setExpenseData({
                amount: '',
                mode: '',
                description: '',
                date: new Date().toISOString().slice(0, 10),
            });

        } catch (error) {
            console.error("Error adding expense", error);
            setMessage(error.response?.data?.message || "Error adding expense");
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Card className="mb-3">
                <Card.Header>Daily Expense Entry</Card.Header>
                <Card.Body>
                    <Form.Group as={Row} controlId="formAmount" className="mb-3">
                        <Form.Label column sm="4">Amount</Form.Label>
                        <Col sm="8">
                            <Form.Control
                                type="number"
                                name="amount"
                                value={expenseData.amount}
                                onChange={handleChange}
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formMode" className="mb-3">
                        <Form.Label column sm="4">Mode of Payment</Form.Label>
                        <Col sm="8">
                            <Form.Select
                                name="mode"
                                value={expenseData.mode}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select mode</option>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                            </Form.Select>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formDescription" className="mb-3">
                        <Form.Label column sm="4">Description</Form.Label>
                        <Col sm="8">
                            <Form.Control
                                type="text"
                                name="description"
                                value={expenseData.description}
                                onChange={handleChange}
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formDate" className="mb-3">
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

                    {message && <p className="text-success fw-bold">{message}</p>}

                    <Button variant="primary" type="submit" className="mx-auto d-block">
                        Submit Expense
                    </Button>
                </Card.Body>
            </Card>
        </Form>
    );
}

export default DailyExpenseForm;
