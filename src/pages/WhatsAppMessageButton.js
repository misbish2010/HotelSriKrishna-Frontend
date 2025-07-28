import React , { useEffect }from "react";
import { format, parse } from "date-fns";

    // Formatting the date in dd/mm/yyyy hh:mm AM/PM format
    const formatDate = (date) => {
        return format(date, "dd/MM/yyyy hh:mm a");
    };


const WhatsAppMessageButton = ({ formData, updatedFormData, bookingResponse }) => {
  useEffect(() => {
    const paymentAmount = Number(updatedFormData.payment_info.paymentAmount);
    const finalPricePerNight = Number(updatedFormData.payment_info.finalPricePerNight);
    const totalAmount = finalPricePerNight * updatedFormData.stay_info.durationOfStay;

    const paidAmountLine =
      paymentAmount > 0 ? `💰 Paid Amount: ₹${paymentAmount.toFixed(2)}\n` : "";

    const roomSummaryMap = {};

    updatedFormData.rooms.forEach((room) => {
      const roomType = room.roomType || "Unknown";
      const occupancy = room.occupancy || "Unknown";
      const acStatus = room.isAcRoom ? "AC" : "Non-AC";
      const typeOccupancy =
        roomType.toLowerCase() === occupancy.toLowerCase()
          ? roomType
          : `${roomType} ${occupancy}`;
      const key = `${typeOccupancy} ${acStatus}`;
      roomSummaryMap[key] = (roomSummaryMap[key] || 0) + 1;
    });

    const roomSummaryLine = Object.entries(roomSummaryMap)
      .map(([key, count]) => `${count} ${key} room${count > 1 ? "s" : ""}`)
      .join(" and ");

    const message = `Dear ${updatedFormData.personal_info.name},

Your booking at *Hotel Sri Krishna, Koraput* is confirmed!

🆔 Booking ID: ${bookingResponse.booking_id}
🛏️ Rooms: ${roomSummaryLine}
📅 Check-in: ${formatDate(updatedFormData.stay_info.checkInDateTime)}
📅 Check-out: ${formatDate(updatedFormData.stay_info.probableCheckOutDateTime)}
${paidAmountLine}💰 Total Amount: ₹${totalAmount.toFixed(2)}

Please reach us at 06852-250372/88955-75244 for any assistance.

Thank you for choosing us!

- Hotel Sri Krishna`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=91${updatedFormData.personal_info.phoneNumber}&text=${encodedMessage}`;
    //const whatsappUrl = `https://wa.me/91${updatedFormData.personal_info.phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  }, []);

  return null; // Nothing to render on screen
};

export default WhatsAppMessageButton;
