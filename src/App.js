import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./Sidebar";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import Footer from "./Footer";
import Dashboard from "./pages/Dashboard";
import CheckOutForm from "./pages/CheckOutForm";
import CheckInForm from "./pages/CheckInForm";
import DailyExpenseForm from "./pages/DailyExpenseForm";
import GstBill from "./pages/GstBill";
import GstBillCombined from "./pages/GstBillCombined";
import RoomGrid from "./pages/Rooms";
import AdvanceBookingForm from "./pages/AdvanceBookingForm";
import BookingDashboard from "./pages/BookingDashboard";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import PaymentTable from "./pages/PaymentTable";

function App() {
  const [activeComponent, setActiveComponent] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const handleSidebarClick = (
    component,
    bookingId = null,
    bookingStatus = ""
  ) => {
    // Map booking status to the appropriate label
    const statusMapping = {
      "Checked-In": "ACTIVE",
      "Checked-Out": "PAST",
      Confirmed: "FUTURE",
    };

    const mappedStatus = statusMapping[bookingStatus] || "ACTIVE"; // Default to PAST if no match
    setActiveComponent(component);

    if (bookingId) {
      console.log(bookingId);
      setSelectedBookingId(bookingId);
      setSelectedStatus(mappedStatus);
    } else {
      setSelectedBookingId(null);
      setSelectedStatus("ACTIVE");
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(""); // Store the username
  const [isAdmin, setIsAdmin] = useState("");

  const handleLogin = (username, isAdmin) => {
    setIsLoggedIn(true);
    setUserName(username);
    setIsAdmin(isAdmin);
  };
  const handleSignUp = (userData) => {
    console.log("New user signed up:", userData);
    //navigate('/login');
    <Navigate to="/" replace />;
    // Call your API or perform necessary actions here
  };
  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  return (
    <div className="app">
      {/* Header Section */}
      {/*<header className="app-header">*/}
      <header>
        <Router>
          <Header isLoggedIn={isLoggedIn} userName={userName} />
          <Routes>
            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />

            <Route
              path="/signup"
              element={<SignUp onSignUp={handleSignUp} />}
            />
            <Route
              path="/signout"
              element={<SignOut onLogout={handleSignOut} />}
            />
          </Routes>
        </Router>
      </header>

      {/* Sidebar */}
      {isLoggedIn && <Sidebar isAdmin={isAdmin} onClick={handleSidebarClick} />}
      {/*<Sidebar onClick={handleSidebarClick} />*/}

      <div
        className="main-content"
        style={{ marginLeft: "250px", padding: "20px" }}
      >
        {activeComponent === "rooms" && <RoomGrid />}
        {activeComponent === "checkin" && <CheckInForm isAdmin={isAdmin} />}
        {activeComponent === "daily_expense" && <DailyExpenseForm />}
        {activeComponent === "gst_billing" && <GstBill />}
        {activeComponent === "advance_booking" && <AdvanceBookingForm isAdmin={isAdmin} />}
        {activeComponent === "collection" && <PaymentTable />}
        {activeComponent === "gst_report" && <GstBillCombined />}
        {activeComponent === "dashboard" && (
          <BookingDashboard
            onViewBooking={(id, status) =>
              handleSidebarClick("checkout", id, status)
            }
          />
        )}
        {activeComponent === "checkout" && (
          <CheckOutForm
            bookingId={selectedBookingId}
            bookingStatus={selectedStatus}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Footer Section */}
      <footer className="app-footer">
        <Footer />
      </footer>
    </div>
  );
}

export default App;