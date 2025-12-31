import React, { useState, useEffect } from "react";
import { Navbar, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header({ isLoggedIn, userName, onHomeClick }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <Navbar bg="dark" className="main-navbar py-2">
      <Container className="header-container">

        {/* LEFT: Title + Logo */}
        <div
          className="header-left"
          onClick={() => isLoggedIn && onHomeClick?.()}
        >
          <span className="hotel-title">Hotel Sri Krishna</span>
          <img
            src={process.env.PUBLIC_URL + "/static/images/logo.png"}
            alt="Logo"
            className="header-logo"
          />
        </div>

        {/* RIGHT: Time + Auth */}
        <div className="header-right">
          <div className="date-time">{currentTime}</div>

          {isLoggedIn ? (
            <div className="auth-line">
              <span className="welcome">Welcome, {userName}</span>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => navigate("/signout")}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="auth-line">
              <Button size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
            </div>
          )}
        </div>

      </Container>
    </Navbar>
  );
}

export default Header;
