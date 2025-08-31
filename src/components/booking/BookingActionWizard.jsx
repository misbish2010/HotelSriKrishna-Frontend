// BookingActionWizard.jsx
import React, { useState, useEffect } from "react";
import { Container, Card, Button, ProgressBar } from "react-bootstrap";
import { toast } from "react-toastify";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import ManageStepGuestInfo from "./ManageStepGuestInfo";
import ManageStepStayInfo from "./ManageStepStayInfo";
import ManageStepRooms from "./ManageStepRooms";
import ManageStepPayment from "./ManageStepPayment";
import ManageStepReviewConfirm from "./ManageStepReviewConfirm";
import CheckoutSettlementModal from "./CheckoutSettlementModal";
import CheckInSettlementModal from "./CheckInSettlementModal";
import CancelSettlementModal from "./CancelSettlementModal"
import GSTInvoice from "../../pages/GSTInvoice";
import {
  updateBooking,
  cancelBooking,
  checkoutBooking,
  checkInBooking,
  fetchAvailableRooms
} from "../../api"; // implement as discussed

const steps = ["Guest Info", "Stay Info", "Rooms", "Payment", "Review"];

const defaultFormData = {
  guestInfo: { name: "", phone: "", idType: "", idNumber: "", address: "", email: "" },
  stayInfo: { checkIn: null, checkOut: null, duration: 1, adults: 2, children: 0, bookingMode: "" },
  rooms: [],
  payments: [],
  bookingStatus: null,
  bookingId: null,
};
const formatDateForApi = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // "2025-08-20"
};

const formatStayDateForApi = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
  // ex: "2025-08-21T18:10:00.000Z"
};

const getStatusRules = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("checked out") || s.includes("checked-out") ) {
      return { canEditGuest: false, canEditStay: false, canEditRooms: false, canEditPayment: false, actions: ["invoice"] };
  }
  if (s.includes("cancelled") || s.includes("canceled")) {
    return { canEditGuest: false, canEditStay: false, canEditRooms: false, canEditPayment: false, actions: [] };
  }
  if (s.includes("checked in") || s.includes("checked-in")) {
    return { canEditGuest: true, canEditStay: true, canEditRooms: false, canEditPayment: true, actions: ["update", "checkout"] };
  }
  // confirmed / booked / default
  return { canEditGuest: true, canEditStay: true, canEditRooms: true, canEditPayment: true, actions: ["update", "cancel", "checkin"] };
};


const BookingActionWizard = ({ bookingDetails, onDone, isAdmin, onViewInvoice  }) => {
    console.log(bookingDetails)
  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingMap, setLoadingMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // These start true (locked). Review step will request unlock for specific section.
  const [disableGuestEditing, setDisableGuestEditing] = useState(true);
  const [disableStayEditing, setDisableStayEditing] = useState(true);
  const [disableRoomEditing, setDisableRoomEditing] = useState(true);
  const [disablePaymentEditing, setDisablePaymentEditing] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showGSTInvoice, setShowGSTInvoice] = useState(false);
  useEffect(() => {
    if (!bookingDetails) return;
    setLoadingMap(true);

    const paymentsFromBackend = (bookingDetails.payment_info || []).map((p) => ({
      amount: p.amount ?? p.paymentAmount ?? 0,
      date: p.date ? (typeof p.date === "string" ? p.date : new Date(p.date).toISOString()) : "",
      mode: p.mode ?? p.paymentMode ?? "",
      notes: p.notes ?? "",
      status: p.status ?? "",
    }));

    const roomsFromBackend = (bookingDetails.room_details || []).map((r) => ({
      roomNumber: r.room_number ?? r.roomNumber ?? "",
      roomType: r.room_type ?? r.roomType ?? "",
      isAcRoom: r.is_ac ?? r.isAcRoom ?? false,
      extraPersons: r.extra_persons ?? r.extraPersons ?? 0,
      occupancy: r.occupancy ?? "",
      roomId: r.room_id ?? r.roomId ?? null,
      pricePerNight: r.room_price ?? r.price_per_night ?? r.pricePerNight ?? 0,
      extraBedPrice: r.extra_bed_price ?? r.extraBedPrice ?? 0,
      // agreedPrice should come from DB room_price or an explicit agreed field
      agreedPrice: r.agreed_price ?? r.final_price_per_night ?? r.room_price ?? 0,
    }));

    const identity = bookingDetails.customer_info?.identity || "";
    let idType = "";
    let idNumber = "";

    if (identity.includes("-")) {
      [idType, idNumber] = identity.split("-", 2); // split into at most 2 parts
    } else {
      idNumber = identity; // no type present
    }
    setFormData({
      guestInfo: {
        name: bookingDetails.customer_info?.name || "",
        phone: bookingDetails.customer_info?.phone || "",
        idType,
        idNumber,
        address: bookingDetails.customer_info?.address || "",
        email: bookingDetails.customer_info?.email || "",
      },
      stayInfo: {
        checkIn: bookingDetails.stay_info?.check_in_date || null,
        checkOut: bookingDetails.stay_info?.check_out_date || bookingDetails.stay_info?.probable_check_out_date || null,
        duration: bookingDetails.stay_info?.duration || 1,
        adults: bookingDetails.stay_info?.adults ?? 2,
        children: bookingDetails.stay_info?.children ?? 0,
        bookingMode: bookingDetails.booking_mode || bookingDetails.stay_info?.mode || "",
      },
      rooms: roomsFromBackend,
      payments: paymentsFromBackend,
      bookingStatus: bookingDetails.booking_status || bookingDetails.status || "",
      bookingId: bookingDetails.booking_id ?? bookingDetails.id ?? null,
    });


    // All locked initially
    setDisableGuestEditing(true);
    setDisableStayEditing(true);
    setDisableRoomEditing(true);
    setDisablePaymentEditing(true);

    setLoadingMap(false);
    const reviewIndex = steps.indexOf("Review");
    setCurrentStep(reviewIndex);
    //setCurrentStep(0);
  }, [bookingDetails]);

  const updateFormData = (section, data) => {
    setFormData((prev) => {
      const updated = { ...prev, [section]: data };

      // If rooms updated, also sync agreed prices into payment
      if (section === "rooms") {
        updated.payment = {
          ...prev.payment,
          roomAgreedPrices: data.map(room => ({
            roomId: room.roomId || room.id || null,
            roomNumber: room.roomNumber || "",
            agreedPrice: room.agreedPrice ?? room.pricePerNight ?? 0
          }))
        };
      }
      return updated;
    });
  };


  const rules = getStatusRules(formData.bookingStatus);

  const validateStep = () => {
    const { guestInfo, stayInfo, rooms, payment } = formData;
    switch (currentStep) {
      case 0: // Guest Info
        return (
          guestInfo?.name &&
          guestInfo?.phone &&
          guestInfo?.idType !== undefined &&
          guestInfo?.address
        );

      case 1: // Stay Info
        return stayInfo?.checkIn && stayInfo?.checkOut;

      case 2: // Rooms
        if (disableRoomEditing) return true; // ✅ Skip validation if read-only
        return (
          Array.isArray(rooms) &&
          rooms.length > 0 &&
          rooms.every(
            (r) => r.roomType !== "" && r.occupancy && r.roomNumber
          )
        );

        case 3: // Payment
          if (disablePaymentEditing) return true; // ✅ Skip validation if read-only

          // Must have at least one payment entry
          if (!Array.isArray(formData.payments) || formData.payments.length === 0) {
            return false;
          }

          // Ensure every payment has required fields
          return formData.payments.every(
            (p) =>
              p.amount != null &&
              p.amount > 0 &&
              p.mode &&
              p.date ? new Date(p.date).toISOString().split("T")[0] : null, // ✅ "YYYY-MM-DD"
          );

      default:
        return true;
    }
  };



  const handleNext = () => { if (!validateStep()) { toast.error("Please fill required fields"); return; } setCurrentStep((s) => Math.min(s + 1, steps.length - 1)); };
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // Room helpers (editable only when allowed)
  const handleAddRoom = () => {
    if (!rules.canEditRooms) return;
    const newRoom = { roomNumber: "", roomType: "", isAcRoom: false, extraPersons: 0, occupancy: "", roomId: null, pricePerNight: 0, extraBedPrice: 0, agreedPrice: 0 };
    updateFormData("rooms", [...formData.rooms, newRoom]);
  };
  const handleRemoveRoom = (idx) => { if (!rules.canEditRooms) return; updateFormData("rooms", formData.rooms.filter((_, i) => i !== idx)); };
  const handleUpdateRoom = (idx, partial) => { if (!rules.canEditRooms) return; const copy = [...formData.rooms]; copy[idx] = { ...copy[idx], ...partial }; updateFormData("rooms", copy); };

  // Payment helpers (editable only when allowed)
  const handleAddPayment = () => { if (!rules.canEditPayment) return; updateFormData("payments", [...formData.payments, { amount: 0, date: new Date().toISOString(), mode: "", notes: "", status: "" }]); };
  const handlePaymentChange = (idx, field, val) => { if (!rules.canEditPayment) return; const copy = [...formData.payments]; copy[idx] = { ...copy[idx], [field]: val }; updateFormData("payments", copy); };
  const handleRemovePayment = (idx) => { if (!rules.canEditPayment) return; updateFormData("payments", formData.payments.filter((_, i) => i !== idx)); };

  // Actions
  const handleUpdateBooking = async () => {
    setSubmitting(true);
    try {
        console.log(formData)
      const payload = {
        bookingId: formData.bookingId,
        personal_info: {
                      ...formData.guestInfo,
                      identity: [formData.guestInfo.idType, formData.guestInfo.idNumber]
                        .filter(Boolean)
                        .join("-"),
                    },
        stay_info: { 
		checkInDateTime: formatStayDateForApi(formData.stayInfo.checkIn),
        probableCheckOutDateTime: formatStayDateForApi(formData.stayInfo.checkOut),
		durationOfStay: formData.stayInfo.duration, bookingMode: formData.stayInfo.bookingMode },
        rooms: formData.rooms.map((r) => ({ room_id: r.roomId, room_number: r.roomNumber, room_type: r.roomType, is_ac: r.isAcRoom, extra_persons: r.extraPersons, occupancy: r.occupancy, final_price_per_night: r.agreedPrice ?? r.pricePerNight })),
        payment_info: formData.payments.map((p) => ({
          amount: p.amount,
          date: p.date ? new Date(p.date).toISOString().split("T")[0] : null, // ✅ always "YYYY-MM-DD"
          mode: p.mode,
          notes: p.notes,
          status: p.status
        })),
      };
      const res = await updateBooking(payload);
      if (res?.success) { toast.success("Updated booking"); onDone && onDone(); }
      else toast.error(res?.message || "Failed to update");
    } catch (err) { console.error(err); toast.error("Server error"); }
    setSubmitting(false);
  };

  // Review requests: Review step will call onRequestEdit(section) to enable and jump
  const handleRequestEdit = (section) => {
    // section: 'guestInfo' | 'stayInfo' | 'rooms' | 'payments'
    if (section === "guestInfo") setDisableGuestEditing(false);
    if (section === "stayInfo") setDisableStayEditing(false);
    if (section === "rooms") setDisableRoomEditing(false);
    if (section === "payments") setDisablePaymentEditing(false);
    // jump to that step
    const map = { guestInfo: 0, stayInfo: 1, rooms: 2, payments: 3 };
    setCurrentStep(map[section] ?? 0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ManageStepGuestInfo guestInfo={formData.guestInfo} onChange={(d) => updateFormData("guestInfo", d)} disableGuestEditing={disableGuestEditing} />;
      case 1:
          return <ManageStepStayInfo
                stayInfo={formData.stayInfo}
                onChange={(d) => updateFormData("stayInfo", d)}
                disableStayEditing={disableStayEditing}
                bookingStatus={bookingDetails?.booking_status || ""}
              />
      case 2:
        return <ManageStepRooms rooms={formData.rooms} onRoomChange={(r) => updateFormData("rooms", r)} disableRoomEditing={disableRoomEditing} onAddRoom={handleAddRoom} onRemoveRoom={handleRemoveRoom} onUpdateRoom={handleUpdateRoom} />;
      case 3:
        return <ManageStepPayment paymentInfo={formData.payments} onChange={(p) => updateFormData("payments", p)} rooms={formData.rooms} stayInfo={formData.stayInfo} disablePaymentEditing={disablePaymentEditing} onAddPayment={handleAddPayment} onRemovePayment={handleRemovePayment} onPaymentChange={handlePaymentChange} />;
      case 4:
        return <ManageStepReviewConfirm formData={formData} bookingStatus={formData.bookingStatus} onRequestEdit={handleRequestEdit} />;
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    const s = getStatusRules(formData.bookingStatus);
    const actions = s.actions || [];
    return (
      <div className="d-flex gap-2">
          {actions.includes("invoice") &&
           <Button
               variant="warning"
               onClick={() => {
                   // Switch app-level to GST invoice page
                   onViewInvoice(bookingDetails);
                 }}
             >
               🧾 GST Invoice
             </Button>
           }

        {actions.includes("update") && <Button variant="primary" onClick={handleUpdateBooking} disabled={submitting}>Update Booking</Button>}
        {actions.includes("checkin") && (<Button variant="primary" onClick={() => {setShowCheckInModal(true);}} disabled={submitting} >Check In Booking</Button> )}
        {actions.includes("cancel") && (<Button variant="danger" onClick={() => {setShowCancelModal(true);}} disabled={submitting}>Cancel Booking</Button>)}
        {actions.includes("checkout") && (<Button variant="danger" onClick={() => {setShowCheckoutModal(true);}} disabled={submitting}>Checkout Booking</Button> )}
        <Button variant="secondary" onClick={() => onDone && onDone()} disabled={submitting}>Close</Button>
      </div>
    );
  };

  if (loadingMap) return <div>Loading booking...</div>;
  //if (!formData || !formData.bookingId) return <div>Select a booking</div>;



  return (
    <>
      <Container className="py-4">
        <h2 className="text-center mb-4">Manage Booking Wizard</h2>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <ProgressBar
            now={(currentStep / (steps.length - 1)) * 100}
            style={{ flex: 1, marginRight: 12 }}
          />
          <div><strong>Status:</strong> {formData.bookingStatus || "N/A"}</div>
        </div>

        <Card className="shadow p-3">
          <Card.Title className="mb-3">
            Step {currentStep + 1}: {steps[currentStep]}
          </Card.Title>

          {renderStep()}

          <div className="d-flex justify-content-between mt-4">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              renderActionButtons()
            )}
          </div>
        </Card>
      </Container>

    <CancelSettlementModal
      show={showCancelModal}
      onHide={() => setShowCancelModal(false)}
      formData={formData}
      onConfirm={async (refundAmount, paymentMode) => {
        setShowCancelModal(false);

        // normalize old payments
        const updatedPayments = (formData.payments || []).map((p) => ({
          ...p,
          date: formatDateForApi(p.date),
        }));

        // add refund if applicable
        if (refundAmount && refundAmount > 0) {
          updatedPayments.push({
            amount: -Number(refundAmount),
            date: formatDateForApi(),
            mode: paymentMode,
            status: "Refund",
          });
        }

        try {
          const payload = {
            bookingId: formData.bookingId,
            personal_info: { ...formData.guestInfo, identity: formData.guestInfo.idNumber },
            stay_info: {
              checkInDateTime: formatStayDateForApi(formData.stayInfo.checkIn),
              probableCheckOutDateTime: formatStayDateForApi(formData.stayInfo.checkOut),
              durationOfStay: formData.stayInfo.duration,
              bookingMode: formData.stayInfo.bookingMode,
            },
            rooms: formData.rooms.map((r) => ({
              room_id: r.roomId,
              room_number: r.roomNumber,
              room_type: r.roomType,
              is_ac: r.isAcRoom,
              extra_persons: r.extraPersons,
              occupancy: r.occupancy,
              final_price_per_night: r.agreedPrice ?? r.pricePerNight,
            })),
            payment_info: updatedPayments,
            bookingStatus: "Cancelled"
          };

          console.log("📤 Sending cancel payload:", payload);

          const res = await updateBooking(payload);
          if (!res?.success) {
            toast.error(res?.message || "Failed in Cancellation");
            return;
          }
          toast.success("Booking Cancelled");
        } catch (err) {
          console.error(err);
          toast.error("Error in Cancellation");
          return;
        }
      }}
    />
    <CheckoutSettlementModal
      show={showCheckoutModal}
      onHide={() => setShowCheckoutModal(false)}
      formData={formData}
      onConfirm={async (extraRefund, extraPayment, extraDiscount, paymentMode, notes, checkoutDate, duration) => {
          console.log(checkoutDate)
        setShowCheckoutModal(false);

        // ✅ normalize existing payments
        const updatedPayments = (formData.payments || []).map((p) => ({
          ...p,
          date: formatDateForApi(p.date),   // force YYYY-MM-DD
        }));

        // ✅ add extra payment
        if (extraPayment && extraPayment > 0) {
          updatedPayments.push({
            amount: Number(extraPayment),
            date: formatDateForApi(),
            mode: paymentMode,
            notes: notes || "Final settlement",
            status: "paid",
          });
        }

        // ✅ add extra discount
        if (extraDiscount && extraDiscount > 0) {
          updatedPayments.push({
            amount: -Number(extraDiscount),
            date: formatDateForApi(),
            mode: "Discount",
            notes: notes || "Checkout discount",
            status: "Discount",
          });
        }

        // ✅ add extra discount
        if (extraRefund && extraRefund > 0) {
          updatedPayments.push({
            amount: -Number(extraRefund),
            date: formatDateForApi(),
            mode: paymentMode,
            notes: notes || "Checkout Refund",
            status: "Refund",
          });
        }
        try {
          const payload = {
            bookingId: formData.bookingId,
            personal_info: { ...formData.guestInfo, identity: formData.guestInfo.idNumber },
            stay_info: {
              checkInDateTime: formatStayDateForApi(formData.stayInfo.checkIn),
              probableCheckOutDateTime: formatStayDateForApi(checkoutDate),  //formData.stayInfo.checkOut,
              durationOfStay: duration,   //formData.stayInfo.duration,
              bookingMode: formData.stayInfo.bookingMode,
            },
            rooms: formData.rooms.map((r) => ({
              room_id: r.roomId,
              room_number: r.roomNumber,
              room_type: r.roomType,
              is_ac: r.isAcRoom,
              extra_persons: r.extraPersons,
              occupancy: r.occupancy,
              final_price_per_night: r.agreedPrice ?? r.pricePerNight,
            })),
            payment_info: updatedPayments,
            bookingStatus: "Checked-Out"
          };

          console.log("📤 Sending payload:", payload);

          const res = await updateBooking(payload);
          console.log(res)
          if (!res?.success) {
            toast.error(res?.message || "Failed to update booking with settlement");
            return;
          }
          toast.success("Checkout Completed");
        } catch (err) {
          console.error(err);
          toast.error("Error in Checkout");
          return;
        }
      }}
    />

    <CheckInSettlementModal
      show={showCheckInModal}
      onHide={() => setShowCheckInModal(false)}
      formData={formData}
      onConfirm={async (extraPayment, paymentMode, checkInDate) => {
        setShowCheckInModal(false);

        // ✅ normalize existing payments
        const updatedPayments = (formData.payments || []).map((p) => ({
          ...p,
          date: formatDateForApi(p.date),   // force YYYY-MM-DD
        }));

        // ✅ add extra payment
        if (extraPayment && extraPayment > 0) {
          updatedPayments.push({
            amount: Number(extraPayment),
            date: formatDateForApi(),
            mode: paymentMode,
            status: "paid",
          });
        }
        try {
          const payload = {
            bookingId: formData.bookingId,
            personal_info: { ...formData.guestInfo, identity: formData.guestInfo.idNumber },
            stay_info: {
              checkInDateTime: formatStayDateForApi(checkInDate),
              probableCheckOutDateTime: formatStayDateForApi(formData.stayInfo.checkout),  //formData.stayInfo.checkOut,
              durationOfStay: formData.stayInfo.duration,
              bookingMode: formData.stayInfo.bookingMode,
            },
            rooms: formData.rooms.map((r) => ({
              room_id: r.roomId,
              room_number: r.roomNumber,
              room_type: r.roomType,
              is_ac: r.isAcRoom,
              extra_persons: r.extraPersons,
              occupancy: r.occupancy,
              final_price_per_night: r.agreedPrice ?? r.pricePerNight,
            })),
            payment_info: updatedPayments,
            bookingStatus: "Checked-In"
          };

          console.log("📤 Sending payload:", payload);

          const res = await updateBooking(payload);
          console.log(res)
          if (!res?.success) {
            toast.error(res?.message || "Failed to checkin");
            return;
          }
          toast.success("Check In Completed");
        } catch (err) {
          console.error(err);
          toast.error("Error in Check In");
          return;
        }
      }}
    />


      {showGSTInvoice && (
        <GSTInvoice
          bookingDetails={formData}
          onClose={() => setShowGSTInvoice(false)}
        />
      )}
    </>
  );


};

export default BookingActionWizard;
