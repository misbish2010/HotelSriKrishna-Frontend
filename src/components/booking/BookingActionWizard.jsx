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
import { sendWhatsAppReceipt } from "../../utils/sendWhatsAppReceipt";
import ReceiptPreviewModal from "../ReceiptPreviewModal";
import {
  updateBooking,
  fetchModifyAvailableRooms,
  fetchAllRooms
} from "../../api"; // implement as discussed

const steps = ["Guest Info", "Stay Info", "Rooms", "Payment", "Review"];

const defaultFormData = {
  guestInfo: { name: "", phone: "", idType: "", idNumber: "", address: "", email: "" },
  stayInfo: { checkIn: null, checkOut: null, duration: 1, bookingMode: "" },
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
      return { canEditGuest: false, canEditStay: false, canEditRooms: false, canEditPayment: true, actions: ["money_receipt","invoice", "update"] };
  }
  if (s.includes("cancelled") || s.includes("canceled")) {
    return { canEditGuest: false, canEditStay: false, canEditRooms: false, canEditPayment: false, actions: [] };
  }
  if (s.includes("checked in") || s.includes("checked-in")) {
    return { canEditGuest: true, canEditStay: true, canEditRooms: true, canEditPayment: true, actions: ["money_receipt", "update", "checkout"] };
  }
  // confirmed / booked / default
  return { canEditGuest: true, canEditStay: true, canEditRooms: true, canEditPayment: true, actions: ["money_receipt", "update", "cancel", "checkin"] };
};

const mergeAvailableRooms = (availableRooms, allRooms, selectedRooms) => {
  const list = [...(availableRooms || [])];

  selectedRooms.forEach((selected) => {
    // Find all variants of this room_number in allRooms
    const variants = (allRooms || []).filter(
      (r) => r.room_number === selected.roomNumber
    );

    variants.forEach((variant) => {
      if (!list.some((x) => x.room_id === variant.room_id)) {
        list.push(variant);
      }
    });

    // Fallback: if no variants found, push selected itself
    if (
      variants.length === 0 &&
      !list.some((x) => x.room_id === selected.roomId)
    ) {
      list.push({
        room_number: selected.roomNumber,
        room_id: selected.roomId,
        room_type: selected.roomType,
        occupancy: selected.occupancy,
        is_ac: selected.isAcRoom,
        room_price: selected.pricePerNight,
        extra_bed_price: selected.extraBedPrice,
      });
    }
  });

  return list;
};

const BookingActionWizard = ({ bookingDetails, onDone, isAdmin, onViewInvoice  }) => {

  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingMap, setLoadingMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const [availableRooms, setAvailableRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [mergedAvailableRooms, setMergedAvailableRooms] = useState([]);


  // These start true (locked). Review step will request unlock for specific section.
  const [disableGuestEditing, setDisableGuestEditing] = useState(true);
  const [disableStayEditing, setDisableStayEditing] = useState(true);
  const [disableRoomEditing, setDisableRoomEditing] = useState(true);
  const [disablePaymentEditing, setDisablePaymentEditing] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showGSTInvoice, setShowGSTInvoice] = useState(false);
  const isEditing =
    !disableGuestEditing ||
    !disableStayEditing ||
    !disableRoomEditing ||
    !disablePaymentEditing;


  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState({ imgData: "", whatsappLink: "" });

  const handleGenerateReceipt = async () => {
    const result = await sendWhatsAppReceipt(bookingDetails);
    setReceiptData(result);
    setShowReceiptModal(true);
  };

  useEffect(() => {
    if (!bookingDetails) return;
    setLoadingMap(true);
    console.log(bookingDetails)
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
      isAcRoom: r.is_ac,
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

        case 3: { // Payment
          if (disablePaymentEditing) return true;

          const payments = formData.payments; // ✅ CORRECT PATH

          console.log("🧾 Payments seen by validator:", payments);

          // ✅ Allow no payments at all
          if (!Array.isArray(payments) || payments.length === 0) {
            return true;
          }

          // 🚫 Validate each payment row
          for (let i = 0; i < payments.length; i++) {
            const p = payments[i];
            const amount = Number(p.amount);

            // Amount must be > 0
            if (!amount || amount <= 0) {
              console.log("❌ Invalid amount", p);
              return false;
            }

            // Mode mandatory
            if (!p.mode) {
              console.log("❌ Payment mode missing", p);
              return false;
            }

            // Date mandatory
            if (!p.date || isNaN(new Date(p.date).getTime())) {
              console.log("❌ Payment date missing/invalid", p);
              return false;
            }
          }

          return true;
        }



      default:
        return true;
    }
  };


const handleNext = async () => {
  if (!validateStep()) {
    toast.error("Please fill required fields");
    return;
  }

  if (steps[currentStep] === "Stay Info" && !disableStayEditing) {
    const { checkIn, checkOut } = formData.stayInfo;

    if (!checkIn || !checkOut) {
      toast.error("Please select both check-in and check-out dates");
      return;
    }

    try {
      // Fetch full room list and currently available rooms
      const all_rooms = await fetchAllRooms();
      const available_rooms = await fetchModifyAvailableRooms(
        1, // durationOfStay
        new Date(checkIn).toISOString(),
        new Date(checkOut).toISOString()
      );

      // ✅ Merge availableRooms + variants of selected rooms
      const merged_rooms = mergeAvailableRooms(
        available_rooms || [],
        all_rooms || [],
        formData.rooms || []
      );

      // Save in state
      setAllRooms(all_rooms || []);
      setAvailableRooms(available_rooms || []);
      setMergedAvailableRooms(merged_rooms); // 👈 add this state variable

      // Move to next step
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    } catch (err) {
      console.error(err);
      toast.error("Error fetching available rooms");
    }
  } else {
    // proceed normally
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }
};

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // Room helpers (editable only when allowed)
  const handleAddRoom = () => {
    if (!rules.canEditRooms) return;
    const newRoom = { roomNumber: "", roomType: "", isAcRoom: false, extraPersons: 0, occupancy: "", roomId: null, pricePerNight: 0, extraBedPrice: 0, agreedPrice: 0 };
    updateFormData("rooms", [...formData.rooms, newRoom]);
  };
  const handleRemoveRoom = (idx) => { if (!rules.canEditRooms) return; updateFormData("rooms", formData.rooms.filter((_, i) => i !== idx)); };
  //const handleUpdateRoom = (idx, partial) => { if (!rules.canEditRooms) return; const copy = [...formData.rooms]; copy[idx] = { ...copy[idx], ...partial }; updateFormData("rooms", copy); };
    const handleUpdateRoom = (idx, partial) => {
      if (!rules.canEditRooms) return;
      const copy = [...formData.rooms];

      if (partial.roomNumber) {
        const selected = mergedAvailableRooms.find(r => r.room_number === partial.roomNumber);
        if (!selected) {
          toast.error(`Room ${partial.roomNumber} is not available for these dates`);
          return;
        }
        copy[idx] = {
          ...copy[idx],
          roomNumber: selected.room_number,
          roomType: selected.room_type,
          isAcRoom: selected.is_ac,
          pricePerNight: selected.room_price,
          agreedPrice: selected.room_price,
          ...partial
        };
      } else {
        copy[idx] = { ...copy[idx], ...partial };
      }

      updateFormData("rooms", copy);
    };

  // Payment helpers (editable only when allowed)
  const handleAddPayment = () => { if (!rules.canEditPayment) return; updateFormData("payments", [...formData.payments, { amount: 0, date: new Date().toISOString(), mode: "", notes: "", status: "" }]); };
  const handlePaymentChange = (idx, field, val) => { if (!rules.canEditPayment) return; const copy = [...formData.payments]; copy[idx] = { ...copy[idx], [field]: val }; updateFormData("payments", copy); };
  const handleRemovePayment = (idx) => { if (!rules.canEditPayment) return; updateFormData("payments", formData.payments.filter((_, i) => i !== idx)); };

  // Actions
  const handleUpdateBooking = async () => {
    setSubmitting(true);
    try {
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
        pricing_info: {
            roomAgreedPrices: formData.rooms.map((r) => ({
              roomId: r.roomId,
              agreedPrice: r.agreedPrice ?? r.pricePerNight ?? 0,
              extraCharges: r.extraCharges ?? 0,
            })),
            totalPrice: formData.rooms.reduce(
              (sum, r) => sum + (Number(r.agreedPrice ?? r.pricePerNight ?? 0) * (formData.stayInfo?.duration || 1)),
              0
            ),
            gstRate: 0,
          },

        payment_info: formData.payments.map((p) => {
          const isPending =
            typeof p.notes === "string" &&
            p.notes.toLowerCase().includes("pending");

          return {
            amount: p.amount,
            date: p.date ? new Date(p.date).toISOString().split("T")[0] : null,
            mode: p.mode,
            notes: p.notes,
            status: isPending ? "Pending" : "Paid",
          };
        }),
      };
      const res = await updateBooking(payload);
      if (res?.success) { toast.success("Updated booking"); onDone && onDone(); }
      else toast.error(res?.message || "Failed to update");
    } catch (err) { console.error(err); toast.error("Server error"); }
    setSubmitting(false);
  };

  // Review requests: Review step will call onRequestEdit(section) to enable and jump
  const handleRequestEdit = (section) => {
    if (section === "guestInfo") setDisableGuestEditing(false);
    if (section === "stayInfo") {
      setDisableStayEditing(false);
      setDisableRoomEditing(false);
      setDisablePaymentEditing(false);
    }
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
        return (
          <ManageStepRooms
            rooms={formData.rooms}
            mergedAvailableRooms={mergedAvailableRooms}
            availableRooms={availableRooms}   // 👈 new
            onRoomChange={(r) => updateFormData("rooms", r)}
            disableRoomEditing={disableRoomEditing}
            onAddRoom={handleAddRoom}
            onRemoveRoom={handleRemoveRoom}
            onUpdateRoom={handleUpdateRoom}
          />
        );

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

         {actions.includes("money_receipt") && (
           <Button
             variant="warning"
             onClick={async () => {
               const result = await sendWhatsAppReceipt(bookingDetails);
               if (result?.imgData) {
                 setReceiptData(result);
                 setShowReceiptModal(true);
               } else {
                 alert("Failed to generate receipt image");
               }
             }}
           >
             🧾 Money Receipt
           </Button>
         )}


        {actions.includes("update") && <Button variant="primary" onClick={handleUpdateBooking} disabled={submitting || !isEditing}>Update Booking</Button>}
        {actions.includes("checkin") && (<Button variant="primary" onClick={() => {setShowCheckInModal(true);}} disabled={submitting || isEditing} >Check In Booking</Button> )}
        {actions.includes("cancel") && (<Button variant="danger" onClick={() => {setShowCancelModal(true);}} disabled={submitting || isEditing}>Cancel Booking</Button>)}
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
          <div className="d-flex gap-4 align-items-center">
            <div className="text-primary">
              <strong>Booking ID:</strong> {bookingDetails?.booking_id || "N/A"}
            </div>
            <div className="text-primary">
               <strong>Name:</strong> {bookingDetails?.customer_info.name || "N/A"}
            </div>
            <div>
              <strong>Status:</strong> {formData.bookingStatus || "N/A"}
            </div>
          </div>
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
            notes: "Cancel Refund",
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
          pricing_info: {
            totalPrice: 0.0,
          },
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
      onConfirm={async (totalPayable, extraRefund, extraPayment, extraDiscount, paymentMode, notes, checkoutDate, duration) => {
        setShowCheckoutModal(false);

        // ✅ normalize existing payments
        const updatedPayments = (formData.payments || []).map((p) => ({
          ...p,
          date: formatDateForApi(p.date),   // force YYYY-MM-DD
        }));

        // ✅ add extra payment
        if (extraPayment && extraPayment > 0) {
          const isPending =
            typeof notes === "string" && notes.toLowerCase().includes("pending");

          updatedPayments.push({
            amount: Number(extraPayment),
            date: formatDateForApi(checkoutDate),
            mode: paymentMode,
            notes: notes || "Final settlement",
            status: isPending ? "Pending" : "Paid",
          });
        }

        // ✅ add extra discount
        if (extraDiscount && extraDiscount > 0) {
          updatedPayments.push({
            amount: -Number(extraDiscount),
            date: formatDateForApi(checkoutDate),
            mode: "None",
            notes: notes || "Checkout discount",
            status: "Discount",
          });
        }

        // ✅ add extra discount
        if (extraRefund && extraRefund > 0) {
          updatedPayments.push({
            amount: -Number(extraRefund),
            date: formatDateForApi(checkoutDate),
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
          pricing_info: {
            totalPrice: totalPayable,
          },
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
            date: formatDateForApi(checkInDate),
            mode: paymentMode,
            status: "Paid",
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

     <ReceiptPreviewModal
          show={showReceiptModal}
          onHide={() => setShowReceiptModal(false)}
          imgData={receiptData.imgData}
          whatsappLink={receiptData.whatsappLink}
        />


      {showGSTInvoice && (
        <GSTInvoice
          bookingDetails={bookingDetails}
          onClose={() => setShowGSTInvoice(false)}
        />
      )}
    </>
  );


};

export default BookingActionWizard;
