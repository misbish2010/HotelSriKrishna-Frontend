// LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios'
import { doLogin } from '../api';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [rememberMe, setRememberMe] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Perform validation
        if (!username || !password) {
            setError('Please enter both email and password.');
            return;
        }
        // Clear any previous error
        setError('');
        const loginData = {
                    username,
                    password
                };
        // Add your login logic here (e.g., calling a backend API)
        try {
            //const response = await axios.post('http://127.0.0.1:5000/api/login', loginData);
            const response = await doLogin(loginData);
            setMessage(response.message);
            setIsAdmin(response.is_admin);
            onLogin(username,response.is_admin)
            navigate('/'); // Redirect to home page after login
        } catch (error) {
            console.error("There was an error adding the expense!", error);
            const errorMessage = error.response?.error?.message || "Error adding expense";
            setMessage(errorMessage);
            setUsername('')
            setPassword('')
            setIsAdmin(false)
            setRememberMe(false)
        }

    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <h2 className="text-center">Login</h2>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formBasicUsername">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="username"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword" className="mt-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="formBasicCheckbox" className="mt-3">
                            <Form.Check
                                type="checkbox"
                                label="Remember me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 mt-4">
                            Login
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
