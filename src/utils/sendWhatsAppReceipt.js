import html2canvas from "html2canvas";
import { format } from "date-fns";

/**
 * Generates a booking receipt image and WhatsApp link.
 * Works for both mobile and desktop — React handles the UI.
 * Returns: { imgData, whatsappLink }
 */
export async function sendWhatsAppReceipt(bookingDetails) {
  const logo = "/static/images/logo.png";
  const stamp = "/static/images/hotel-stamp-preview.png";

  if (!bookingDetails) return { imgData: null, whatsappLink: null };

  const guest = bookingDetails.customer_info || {};
  const phone = guest.phone?.replace(/\D/g, "");
  const bookingId = bookingDetails.booking_id || "";
  const stay = bookingDetails.stay_info || {};
  const nights = stay.duration || 1;
  const rooms = bookingDetails.room_details || [];
  const payments = bookingDetails.payment_info || [];

  let total = 0;
  const roomSummaryMap = {};

  rooms.forEach((room) => {
    const type = room.room_type || "Room";
    const ac = room.is_ac ? "AC" : "Non-AC";
    const occupancy = room.occupancy || "";
    const key =
      type.toLowerCase() === occupancy.toLowerCase()
        ? `${type} ${ac}`
        : `${type} ${occupancy} ${ac}`.trim();
    roomSummaryMap[key] = (roomSummaryMap[key] || 0) + 1;
    total += (room.room_price || 0) * nights;
  });

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = total - totalPaid;
  const roomSummary = Object.entries(roomSummaryMap)
    .map(([key, count]) => `${count} ${key}`)
    .join(", ");

  // --- CREATE RECEIPT HTML (OFFSCREEN DIV) ---
  const receiptHtml = document.createElement("div");
  receiptHtml.id = "receipt-capture";
  receiptHtml.style.cssText = `
    width: 420px;
    margin: 20px auto;
    padding: 18px 20px;
    background: #fff;
    border: 2px solid #1e293b;
    font-family: 'Segoe UI', sans-serif;
    color: #111;
    font-size: 13px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    border-radius: 8px;
  `;

  receiptHtml.innerHTML = `
    <h1 style="text-align:center; margin:5px 0 10px; font-size:20px; font-weight:700; color:#1e3a8a;">
      MONEY RECEIPT
    </h1>

    <div style="display:flex; align-items:center; justify-content:flex-start; margin-top:8px; padding:0 8px; position:relative;">
      <div style="text-align:left;">
        <h2 style="margin:0; font-size:16px; color:#111;">HOTEL SRI KRISHNA</h2>
        <p style="margin:2px 0; font-size:12px; color:#444;">Koraput, Odisha – 764020</p>
        <p style="margin:0; font-size:12px; color:#444;">📞 06852-357172</p>
      </div>
      <img src="${logo}" alt="Hotel Logo"
        style="position:absolute; right:8px; top:0; width:70px; height:auto; border:2px solid #ddd; border-radius:6px; object-fit:contain;"/>
    </div>

    <hr style="border:none; border-top:2px solid #1e3a8a; margin:10px 0;"/>

    <table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:13px; table-layout:fixed;">
      <colgroup><col style="width:50%;"><col style="width:50%;"></colgroup>
      <tr>
        <td style="padding:4px 6px;">
          <b>Received <span style="color:#15803d;">₹${totalPaid.toLocaleString()}</span></b>
          from <b>${guest.name || "-"}</b>
        </td>
        <td style="padding:4px 6px; text-align:right;">
          <b>Receipt No:</b> ${bookingId}
        </td>
      </tr>
      <tr>
        <td style="padding:4px 6px;"><b>Check-In:</b> ${stay.check_in_date ? format(new Date(stay.check_in_date), "dd MMM yyyy") : "-"}</td>
        <td style="padding:4px 6px; text-align:right;"><b>Check-Out:</b> ${stay.probable_check_out_date ? format(new Date(stay.probable_check_out_date), "dd MMM yyyy") : "-"}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 6px;"><b>Room Type:</b> ${roomSummary || "-"}</td>
      </tr>
    </table>

    <hr style="border:none; border-top:1px dashed #aaa; margin:10px 0;"/>

    <table style="width:100%; border-collapse:collapse;">
      <tr><td><b>Total Amount</b></td><td style="text-align:right;">₹${total.toFixed(2)}</td></tr>
      <tr><td><b>Amount Paid</b></td><td style="text-align:right; color:#15803d; font-weight:600;">₹${totalPaid.toFixed(2)}</td></tr>
      <tr><td><b>Balance Due</b></td><td style="text-align:right; color:${balance > 0 ? "#dc2626" : "#15803d"}; font-weight:600;">₹${balance > 0 ? balance.toFixed(2) : "0.00"}</td></tr>
    </table>

    <hr style="border:none; border-top:2px solid #1e3a8a; margin:10px 0;"/>

    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:25px; font-size:12px;">
      <div><img src="${stamp}" alt="Manager Stamp" style="width:90px; height:auto; opacity:0.9;"/></div>
      <div style="text-align:right;">
        <p style="margin:0 0 35px 0;">Manager Signature<br/><strong>Hotel Sri Krishna</strong></p>
        <div style="border-top:1px solid #999; width:140px; margin-left:auto;"></div>
      </div>
    </div>

    <p style="text-align:center; font-size:11px; margin-top:12px; color:#15803d; font-weight:500;">
      Thank you for choosing Hotel Sri Krishna 🌿 Have a pleasant stay!
    </p>
  `;

  // --- Capture HTML as Image ---
  document.body.appendChild(receiptHtml);
  const canvas = await html2canvas(receiptHtml, { backgroundColor: "#fff", scale: 2 });
  document.body.removeChild(receiptHtml);

  const imgData = canvas.toDataURL("image/png");

  // --- WhatsApp Message ---
  const message = encodeURIComponent(
    `Dear ${guest.name || "Guest"},\n\nThank you for staying with *Hotel Sri Krishna*! 🌿\nHere is your receipt for booking *#${bookingId}*.\n\nWarm regards,\nHotel Sri Krishna, Koraput.`
  );
  const whatsappLink = phone ? `https://api.whatsapp.com/send/?phone=91${phone}&text=${message}` : null;

  // ✅ Return to React for rendering (no DOM side effects)
  return { imgData, whatsappLink };
}
