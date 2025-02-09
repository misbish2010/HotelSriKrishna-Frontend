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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarClick = (component, bookingId = null, bookingStatus = "") => {
    const statusMapping = {
      "Checked-In": "ACTIVE",
      "Checked-Out": "PAST",
      Confirmed: "FUTURE",
    };
    const mappedStatus = statusMapping[bookingStatus] || "ACTIVE";
    setActiveComponent(component);
    setSelectedBookingId(bookingId || null);
    setSelectedStatus(mappedStatus);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (username, isAdmin) => {
    setIsLoggedIn(true);
    setUserName(username);
    setIsAdmin(isAdmin);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <div className="app">
        {/* Header Section */}
        <Header isLoggedIn={isLoggedIn} userName={userName} />

        {/* Sidebar - Responsive */}
        {isLoggedIn && <Sidebar isAdmin={isAdmin} onClick={handleSidebarClick} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}

        {/* Main Content */}
        <div className={`main-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signout" element={<SignOut onLogout={handleSignOut} />} />
          </Routes>

          {/* Render Components Based on Sidebar Click */}
          {activeComponent === "rooms" && <RoomGrid />}
          {activeComponent === "checkin" && <CheckInForm isAdmin={isAdmin} />}
          {activeComponent === "daily_expense" && <DailyExpenseForm />}
          {activeComponent === "gst_billing" && <GstBill />}
          {activeComponent === "advance_booking" && <AdvanceBookingForm isAdmin={isAdmin} />}
          {activeComponent === "collection" && <PaymentTable />}
          {activeComponent === "gst_report" && <GstBillCombined />}
          {activeComponent === "dashboard" && (
            <BookingDashboard onViewBooking={(id, status) => handleSidebarClick("checkout", id, status)} />
          )}
          {activeComponent === "checkout" && (
            <CheckOutForm bookingId={selectedBookingId} bookingStatus={selectedStatus} isAdmin={isAdmin} />
          )}
        </div>

        {/* Footer Section */}
              <footer className="app-footer">
                <Footer />
              </footer>
      </div>
    </Router>
  );
}

export default App;
