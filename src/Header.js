import React, { useState, useEffect } from 'react';
import { Navbar, Container, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Header.css'; // Additional styling
import { Link } from 'react-router-dom';

function Header({ isLoggedIn, userName }) {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/login'); // Navigate to the login page
    };
    const handleSignUpClick = () => {
        navigate('/signup'); // Navigate to the signup page
     };
    const handleSignOutClick = () => {
        navigate('/signout'); // Navigate to the signup page
    };


    const [currentTime, setCurrentTime] = useState('');

    // Update the time every second
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleString());
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    return (
        <header>
            <Navbar bg="dark" expand="lg" className="main-navbar">
                <Container>
                    {/* Left side: Logo */}
                    <Navbar.Brand href="#" className="logo">
                        <img
                            src={process.env.PUBLIC_URL + '/static/images/logo.png'}
                            alt="Hotel Logo"
                            height="60"
                        />
                    </Navbar.Brand>

                    {/* Center: Hotel name */}
                    <Navbar.Text className="hotel-name mx-auto">
                        <h1>Hotel Sri Krishna</h1>
                    </Navbar.Text>

                    {/* Right side: Date, Time, and Auth Buttons */}
                                        <div className="text-end">
                                            {/* Current Date and Time */}
                                            <div className="date-time">{currentTime}</div>

                                            {/* Login, Sign Up, or Sign Out */}
                                            <div className="auth-buttons mt-2">
                                                {!isLoggedIn ? (
                                                    <>
                                                       <Button variant="primary" size="sm" className="mx-1" onClick={handleLoginClick} >
                                                            Login
                                                        </Button>
                                                        <Button variant="secondary" size="sm" className="mx-1" onClick={handleSignUpClick}>
                                                            Sign Up
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="welcome-message me-2">Welcome, {userName}</span>
                                                        <Button variant="outline-danger" size="sm" onClick={handleSignOutClick}>
                                                            Sign Out
                                                        </Button>

                                                    </>
                                                )}
                                            </div>
                                        </div>
                </Container>
            </Navbar>
        </header>
    );
}

export default Header;
