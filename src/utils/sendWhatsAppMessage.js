import { format } from "date-fns";

/**
 * Opens WhatsApp chat with a pre-filled booking message.
 * @param {object} formData - Original form data (guest, stay, rooms).
 * @param {object} updatedFormData - Final saved form data (can include normalized fields).
 * @param {object} bookingResponse - Response object from createBooking API.
 */
    export function sendWhatsAppMessage(payload, bookingResponse) {
      console.log(bookingResponse)
      console.log(payload)
      const guest = payload.personal_info;
      const stay = payload.stay_info;
      const rooms = payload.rooms || [];
      const payment = payload.payment_info?.[0] || {};

      // Calculate totals
      const nights = stay.durationOfStay || 1;
      const roomSummaryMap = {};
      let total = 0;

      rooms.forEach((room) => {
        const type = room.roomType || "Room";
        const occupancy = room.occupancy || "";
        const ac = room.isAcRoom ? "AC" : "Non-AC";
        const key =
            type.toLowerCase() === occupancy.toLowerCase()
              ? `${type} ${ac}`
              : `${type} ${occupancy} ${ac}`.trim();
        roomSummaryMap[key] = (roomSummaryMap[key] || 0) + 1;

        // compute price (fallback if backend doesn't send)
        const pricePerNight = room.finalPricePerNight || 0;
        total += pricePerNight * nights;
      });
      console.log(roomSummaryMap)

      console.log(total)
      // Payment details
      const paid = payment.amount || 0;
      const balance = total - paid;



      const roomSummary = Object.entries(roomSummaryMap)
        .map(([key, count]) => `${count} ${key}`)
        .join(", ");

      const intro =
        payload.bookingStatus === "Confirmed"
          ? `Your booking at Hotel Sri Krishna is confirmed!`
          : `You are successfully checked in at Hotel Sri Krishna!`;

      const message = `Dear ${guest.name},

    ${intro}

    🆔 Booking ID: ${bookingResponse.booking_id}
    🛏️ Rooms: ${roomSummary}
    📅 Check-in: ${new Date(stay.checkInDateTime).toLocaleString()}
    📅 Check-out: ${new Date(stay.probableCheckOutDateTime).toLocaleString()}
    💰 Total: ₹${total}
    💵 Paid: ₹${paid}
    ${balance > 0 ? `Balance Due: ₹${balance}` : ""}

    Thank you for choosing us!`;

      window.open(
        `https://api.whatsapp.com/send/?phone=91${guest.phone}&text=${encodeURIComponent(
          message
        )}`,
        "_blank"
      );
    }
