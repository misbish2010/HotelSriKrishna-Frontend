import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios'
import { addUser } from '../api';

const SignUp = ({ onSignUp }) => {
    const [signUpData, setSignUpData] = useState({
        username: '',
        password: '',
        isAdmin: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSignUpData({
            ...signUpData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!signUpData.username || !signUpData.password) {
            setError('Username and Password are required.');
            return;
        }

        setError('');

        // Call an API or parent function to handle sign up
        try {
            // Replace with your Flask backend URL
           // const response = await axios.post('http://127.0.0.1:5000/api/add_user', signUpData);
            const response = await addUser(signUpData);
            setMessage(response.message);
            setSuccess('Sign up successful!');
            alert('New User Added');

            if (onSignUp) {
               onSignUp(signUpData); // Pass formData back to the parent component
            }
            navigate('/'); // Redirect to home page after login
        } catch (error) {
            console.error("There was an error adding the expense!", error);
            const errorMessage = error.response?.message || "Error adding expense";
            setMessage(errorMessage);
        }


        // Clear the form after submission
        setSignUpData({ username: '', password: '', isAdmin: false });
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <h2 className="text-center">Sign Up</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        {/* Username Field */}
                        <Form.Group controlId="formUsername">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                name="username"
                                value={signUpData.username}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* Password Field */}
                        <Form.Group controlId="formPassword" className="mt-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                name="password"
                                value={signUpData.password}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* Is Admin Checkbox */}
                        <Form.Group controlId="formIsAdmin" className="mt-3">
                            <Form.Check
                                type="checkbox"
                                label="Is Admin"
                                name="isAdmin"
                                checked={signUpData.isAdmin}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Submit Button */}
                        <Button variant="primary" type="submit" className="w-100 mt-4">
                            Sign Up
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default SignUp;
