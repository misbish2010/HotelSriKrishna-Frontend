import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import "./Sidebar.css";

function Sidebar({ isAdmin, onClick }) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Track collapse state

  // Function to toggle collapse/expand
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : "expanded"}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isCollapsed ? ">>>>>" : "<<<<<"}
      </button>
      <Nav className="flex-column">
        <Nav.Link
          onClick={() => onClick("checkin")}
          href="#checkin"
          className="sidebar-link"
        >
          CHECK-IN
        </Nav.Link>

        <Nav.Link
          onClick={() => onClick("checkout")}
          href="#checkout"
          className="sidebar-link"
        >
          MANAGE BOOKING
        </Nav.Link>

        <Nav.Link
          onClick={() => onClick("advance_booking")}
          href="#advancebooking"
          className="sidebar-link"
        >
          ADVANCE BOOKING
        </Nav.Link>

        <Nav.Link
          onClick={() => onClick("rooms")}
          href="#rooms"
          className="sidebar-link"
        >
          ROOMS
        </Nav.Link>


        <Nav.Link
          onClick={() => onClick("dashboard")}
          href="#dashboard"
          className="sidebar-link"
        >
          BOOKING DASHBOARD
        </Nav.Link>

        {isAdmin && (
          <Nav.Link
            onClick={() => onClick("collection")}
            href="#collection"
            className="sidebar-link"
          >
            PAYMENT DASHBOARD
          </Nav.Link>
        )}

        <Nav.Link
          onClick={() => onClick("gst_billing")}
          href="#gstbilling"
          className="sidebar-link"
        >
          BILLING
        </Nav.Link>

        <Nav.Link
          onClick={() => onClick("daily_expense")}
          href="#dailyexpense"
          className="sidebar-link"
        >
          EXPENSE
        </Nav.Link>



        {isAdmin && (
          <Nav.Link
            onClick={() => onClick("gst_report")}
            href="#gstreport"
            className="sidebar-link"
          >
            GST Monthly Bills
          </Nav.Link>
        )}

        {/*<Nav.Link onClick={() => onClick('payment')} href="#payment" className="sidebar-link">PAYMENT</Nav.Link>
        <Nav.Link onClick={() => onClick('refund')} href="#refund" className="sidebar-link">REFUND</Nav.Link>
        <Nav.Link onClick={() => onClick('cancel_booking')} href="#cancelbooking" className="sidebar-link">CANCEL BOOKING</Nav.Link>*/}
      </Nav>
    </div>
  );
}

export default Sidebar;
