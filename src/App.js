// App.js
import React, { useState } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CheckInWizard from "./components/checkin/CheckInWizard";
import DailyChartPage from "./pages/DailyChartPage";
import BookingActionWizard from './components/booking/BookingActionWizard';
import BookingSearchPage from './components/booking/BookingSearchPage';
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
import BookingDashboard from "./pages/BookingDashboard";
import DailyExpenseForm from "./pages/DailyExpenseForm";
import PaymentTable from "./pages/PaymentTable";
import RoomGridTimeBased from "./pages/RoomGridTimeBased";
import RoomMultiNightGrid from "./pages/RoomMultiNightGrid";
import RoomDailyGrid from "./pages/RoomDailyGrid";
import GSTInvoice from "./pages/GSTInvoice";
import BulkGSTInvoice from "./pages/BulkGSTInvoice";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import Dashboard from "./pages/Dashboard";
function App() {
  //const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);


    const handleSidebarClick = (component, bookingDetails = null) => {
      setActiveComponent(component);
      setSelectedBookingDetails(bookingDetails);
    };

  const handleLogin = (username, isAdmin) => {
    setIsLoggedIn(true);
    setUserName(username);
    setIsAdmin(isAdmin);
    setActiveComponent("dashboard")
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
    setActiveComponent(null);
  };

  return (
    <Router>
      <div className="app">
        <ToastContainer position="top-center" />

        <Header isLoggedIn={isLoggedIn} userName={userName} onHomeClick={() => setActiveComponent("dashboard")} />

        {isLoggedIn && (
          <Sidebar
            isAdmin={isAdmin}
            onClick={handleSidebarClick}
            onCollapse={setIsSidebarCollapsed}
          />
        )}

        <div className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <Routes>
            <Route
              path="/login"
              element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
            />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signout" element={<SignOut onLogout={handleSignOut} />} />
          </Routes>

          {activeComponent === "checkin" && (
            <CheckInWizard mode="checkin" isAdmin={isAdmin} />
          )}

          {activeComponent === "advance_booking" && (
            <CheckInWizard mode="advance" isAdmin={true} />
          )}

            {activeComponent === "dashboard" && (
                        <Dashboard onNavigate={handleSidebarClick} />
                      )}

          {activeComponent === "bookingSearch" && (
            <BookingSearchPage
              isAdmin={isAdmin}
              onBookingFound={(details) => handleSidebarClick("checkout", details)}
            />
          )}



          {activeComponent === "checkout" && selectedBookingDetails && (
            <BookingActionWizard
              bookingDetails={selectedBookingDetails}
              isAdmin={isAdmin}
              onDone={() => { /* refresh parent */ }}
              onViewInvoice={(details) => {
                setSelectedBookingDetails(details);
                setActiveComponent("invoiceFromWizard");
              }}
            />
          )}


{activeComponent === "booking_dashboard" && (
  <BookingDashboard
    onViewBooking={(bookingObj) => {
      setSelectedBookingDetails(bookingObj);

      if (bookingObj.openInvoice) {
        // 🧾 clicked → GST invoice
        setActiveComponent("invoice");
      } else {
        // 👁 clicked → Booking wizard
        setActiveComponent("checkout");
      }
    }}
  />
)}


{activeComponent === "rooms_time_based" && <RoomGridTimeBased />}

{activeComponent === "rooms_daily_chart" && <DailyChartPage />}

{activeComponent === "rooms_daily_grid" && <RoomDailyGrid />}

{activeComponent === "rooms_multi_night" && <RoomMultiNightGrid />}

          {activeComponent === "dailyExpense" && <DailyExpenseForm />}
          {activeComponent === "collection" && <PaymentTable />}



          {activeComponent === "invoice" && selectedBookingDetails && (
            <GSTInvoice
              bookingId={selectedBookingDetails.booking_id}
              bookingDetails={selectedBookingDetails}
              onClose={() => setActiveComponent("dashboard")}
            />
          )}

          {activeComponent === "invoiceFromWizard" && selectedBookingDetails && (
            <GSTInvoice
              bookingId={selectedBookingDetails.booking_id}
              bookingDetails={selectedBookingDetails}
              onClose={() => setActiveComponent("checkout")}   // 👈 go back to wizard
            />
          )}

            {activeComponent === "invoice_report" && (
              <BulkGSTInvoice onClose={() => setActiveComponent("dashboard")} />
            )}

        </div>
      </div>
    </Router>
  );
}

export default App;
