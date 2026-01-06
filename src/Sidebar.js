import React, { useState, useEffect, useRef } from "react";
import { Nav } from "react-bootstrap";
import "./Sidebar.css";

function Sidebar({ isAdmin, onClick }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isCollapsed, setIsCollapsed] = useState(isMobile); // Default collapsed for mobile only
  const sidebarRef = useRef(null);

  // Toggle sidebar manually (for mobile only)
  const toggleSidebar = () => {
    if (isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Close sidebar when clicking outside (only if expanded on mobile)
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isMobile &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsCollapsed(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      if (!mobileView) {
        setIsCollapsed(false); // Always expanded on desktop
      } else {
        setIsCollapsed(true); // Collapse on mobile
      }
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* Toggle button (Only visible on mobile) */}
      {isMobile && (
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
      )}

      <div
        ref={sidebarRef}
        className={`sidebar ${isCollapsed ? "collapsed" : "expanded"}`}
      >
        <Nav className="flex-column">

                  <Nav.Link onClick={() => onClick("advance_booking")} href="#advancebooking" className="sidebar-link">
                    ADVANCE BOOKING
                  </Nav.Link>

                  <Nav.Link onClick={() => onClick("checkin")} href="#checkin" className="sidebar-link">
                    CHECK-IN
                  </Nav.Link>

                  <Nav.Link
                    onClick={() => onClick("bookingSearch")}
                    href="#bookingSearch"
                    className="sidebar-link"
                  >
                    MANAGE BOOKING
                  </Nav.Link>

        		  <Nav.Link onClick={() => onClick("booking_dashboard")} href="#booking_dashboard" className="sidebar-link">
                    BOOKING DASHBOARD
                  </Nav.Link>

                   <Nav.Link onClick={() => onClick("rooms_daily_chart")} className="sidebar-link">
                     DAILY CHART
                   </Nav.Link>

                   <Nav.Link onClick={() => onClick("rooms_daily_grid")} className="sidebar-link">
                     Rooms – Daily Grid
                   </Nav.Link>
{/*
                   <Nav.Link onClick={() => onClick("rooms_time_based")} className="sidebar-link">
                     Rooms – Live Status
                   </Nav.Link>

                   <Nav.Link onClick={() => onClick("rooms_daily_chart")} className="sidebar-link">
                     Rooms – Daily Chart
                   </Nav.Link>



                   <Nav.Link onClick={() => onClick("rooms_multi_night")} className="sidebar-link">
                     Rooms – Stay Planner
                   </Nav.Link>

                   <Nav.Link onClick={() => onClick("dailyExpense")} href="#expenditure" className="sidebar-link">
                      EXPENSES
                   </Nav.Link>

                 {isAdmin && (
                    <Nav.Link onClick={() => onClick("collection")} href="#collection" className="sidebar-link">
                      PAYMENT DASHBOARD
                    </Nav.Link>
                  )}

                  <Nav.Link onClick={() => onClick("dashboard")} href="#dashboard" className="sidebar-link">
                    HOME
                  </Nav.Link>

                  <Nav.Link onClick={() => onClick("invoice_report")} href="#invoice_report" className="sidebar-link">
                       GST Reports
                  </Nav.Link> */}

                </Nav>
      </div>
    </>
  );
}

export default Sidebar;
