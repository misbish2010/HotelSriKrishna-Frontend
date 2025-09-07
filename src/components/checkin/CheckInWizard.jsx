// CheckInWizard.jsx
import React, { useState, useEffect  } from "react";
import { Container, Card, Button, ProgressBar } from "react-bootstrap";
import { toast } from 'react-toastify';
import StepGuestInfo from "./StepGuestInfo";
import StepStayInfo from "./StepStayInfo";
import StepRooms from "./StepRooms";
import StepPayment from './StepPayment';
import StepReviewConfirm from "./StepReviewConfirm";
import { createBooking } from "../../api";
import { fetchUserDetails } from "../../api";
import { fetchAvailableRooms } from "../../api";
import { sendWhatsAppMessage } from "../../utils/sendWhatsAppMessage";
const steps = ["Guest Info", "Stay Info", "Rooms", "Payment", "Review"];

const defaultFormData = {
  guestInfo: {
    name: "",
    phone: "",
    idType: "",
    idNumber: "",
    address: "",
    email: ""
  },
  stayInfo: {
    checkIn: null,
    checkOut: null,
    duration: 1,
    adults: 2,
    children: 0,
    bookingMode: "WALKIN"
  },
  rooms: [],
  payment: {
    paymentAmount: 0,
    finalPricePerNight: 0,
    paymentMode: "",
    paymentDate: ""
  }
};

const CheckInWizard = ({ mode = "checkin", isAdmin }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [availableRooms, setAvailableRooms] = useState([]);

  const updateFormData = (section, data) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };
    const validateStep = () => {
      const { guestInfo, stayInfo, rooms, payment  } = formData;

      switch (currentStep) {
        case 0:
          return guestInfo?.name && guestInfo?.phone && guestInfo?.idType && guestInfo?.idNumber && guestInfo?.address;

        case 1:
          return stayInfo?.checkIn && stayInfo?.checkOut;

        case 2:
          return (
            Array.isArray(rooms) &&
            rooms.length > 0 &&
            rooms.every(r => r.roomType && r.occupancy && r.roomNumber)
          );

            case 3: {
              const pricing = payment?.pricing_info;
              const payments = payment?.payment_info || [];

              const hasFinalPrice =
                (pricing?.roomAgreedPrices && pricing.roomAgreedPrices.length > 0) ||
                pricing?.totalPrice > 0;

              const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

              const hasPaymentAmount =
                latestPayment?.amount != null && latestPayment.amount !== "";
              const hasPaymentDate =
                latestPayment?.date != null && latestPayment.date !== "";

              // Validation: if there's a payment amount, payment date must be entered
              if (hasPaymentAmount && !hasPaymentDate) {
                return false;
              }

              return hasFinalPrice && hasPaymentAmount;
            }



        default:
          return true;
      }
    };


  const handleNext = () => {
    if (!validateStep()) {
      toast.error("Please fill all required fields before continuing.");
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => setCurrentStep((prev) => prev - 1);

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handlePhoneBlur = async () => {
    const phone = formData.guestInfo.phone;
    if (phone && phone.length === 10) {
      try {
        const user = await fetchUserDetails(phone);
        if (user) {
          // Split identity into idType and idNumber
          let idType = "";
          let idNumber = "";
          if (user.identity) {
            if (user.identity.includes("-")) {
              [idType, idNumber] = user.identity.split("-", 2);
            } else {
              idNumber = user.identity;
            }
          }

          updateFormData("guestInfo", {
            ...formData.guestInfo,
            ...user,
            idType,
            idNumber,
          });
        }
      } catch (err) {
        console.error("Failed to fetch guest:", err);
      }
    }
  };


  useEffect(() => {
    const fetchRooms = async () => {
      if (formData.stayInfo.checkIn && formData.stayInfo.checkOut) {
        const data = await fetchAvailableRooms(formData.stayInfo.duration, formData.stayInfo.checkIn, formData.stayInfo.checkOut);
        setAvailableRooms(data || []);
      } else {
        setAvailableRooms([]);
      }
    };
    fetchRooms();
  }, [formData.stayInfo.checkIn, formData.stayInfo.checkOut]);

  // GST rate in percentage (change if needed)
  const GST_RATE = 12;

  const totalAmount = (() => {
    const nights = formData.stayInfo?.duration || 1;
    const baseTotal = formData.rooms.reduce((sum, room) => {
      const base = parseFloat(room.pricePerNight || room.price || 0);
      const extraCost = (room.extraPersons || 0) * 300; // or from room.extraBedPrice
      return sum + (base + extraCost) * nights;
    }, 0);

    const gstAmount = (baseTotal * GST_RATE) / 100;
    return baseTotal + gstAmount;
  })();




  const handleSubmit = async () => {
    setSubmitting(true);
      const bookingStatus = mode === "advance" ? "Confirmed" : "Checked-In";
      const payload = {
        personal_info: {
          ...formData.guestInfo,
          identity: [formData.guestInfo.idType, formData.guestInfo.idNumber]
            .filter(Boolean)
            .join("-"),
        },
        stay_info: {
          ...formData.stayInfo,
          checkInDateTime: formData.stayInfo.checkIn,
          probableCheckOutDateTime: formData.stayInfo.checkOut,
          durationOfStay: formData.stayInfo.duration,
        },
        rooms: formData.rooms.map((room, index) => ({
          ...room,
          finalPricePerNight:
            formData.payment?.pricing_info?.roomAgreedPrices?.[index]?.agreedPrice ||
            null,
        })),

        // ✅ Split pricing_info vs payment_info
        pricing_info: formData.payment?.pricing_info || {},

        payment_info: formData.payment?.payment_info || [],

        bookingStatus: bookingStatus,
      };

      try {
        const res = await createBooking(payload);
        if (res?.success) {
          toast.success("Booking successful! ✅");
          // Trigger WhatsApp
          sendWhatsAppMessage(payload, res);
          setFormData(defaultFormData);

          setCurrentStep(0);
        } else {
          toast.error("Booking failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Booking failed due to server error.");
      }
    setSubmitting(false);
  };


  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepGuestInfo
              guestInfo={formData.guestInfo}
              onChange={(data) => updateFormData("guestInfo", data)}
              onPhoneBlur={handlePhoneBlur}
            />
        );
      case 1:
        return (
          <StepStayInfo
            stayInfo={formData.stayInfo}
            onChange={(newStayInfo) => updateFormData("stayInfo", newStayInfo)}
            mode={mode}
            isAdmin={isAdmin}
          />
        );
      case 2:
        return (
          <StepRooms
            rooms={formData.rooms}
            availableRooms={availableRooms}
            onRoomChange={(updatedRooms) => updateFormData("rooms", updatedRooms)}
            onAddRoom={() =>
              updateFormData("rooms", [
                ...formData.rooms,
                {
                  roomType: "",
                  occupancy: "",
                  isAcRoom: "",
                  roomNumber: "",
                  extraPersons: 0,
                  roomId: "",
                },
              ])
            }
            onRemoveRoom={(index) =>
              updateFormData(
                "rooms",
                formData.rooms.filter((_, i) => i !== index)
              )
            }
          />

        );

      case 3:
        return (
          <StepPayment
            paymentInfo={formData.payment}
            onChange={(data) => updateFormData("payment", data)}
            totalAmount={totalAmount}
            gstRate={GST_RATE}
            isAdmin={isAdmin}
            rooms={formData.rooms}
            stayInfo={formData.stayInfo}
          />
        );

      case 4:
        return <StepReviewConfirm formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Hotel Check-In Wizard</h2>
      <ProgressBar now={(currentStep / (steps.length - 1)) * 100} className="mb-4" />
      <Card className="shadow p-3">
        <Card.Title className="mb-3">Step {currentStep + 1}: {steps[currentStep]}</Card.Title>
        {renderStep()}
        <div className="d-flex justify-content-between mt-4">
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0}>
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="success" onClick={handleSubmit} disabled={submitting}>
              {mode === "advance" ? "Confirm Booking" : "Check-In Now"}
            </Button>
          )}
        </div>
        {successMessage && <div className="alert alert-success mt-4">{successMessage}</div>}
      </Card>
    </Container>
  );
};

export default CheckInWizard;
