import html2canvas from "html2canvas";
import { format } from "date-fns";

export async function sendWhatsAppGSTInvoice(booking, calc, gstForm, HOTEL) {
  if (!booking) return { imgData: null, whatsappLink: null };

  const guest = booking.customer_info || {};
  const phone = guest.phone?.replace(/\D/g, "");
  const stay = booking.stay_info || {};

  const invoiceHtml = document.createElement("div");
  invoiceHtml.style.cssText = `
    width: 800px;
    padding: 24px;
    background: white;
    font-family: Arial, sans-serif;
    color: #000;
  `;

  invoiceHtml.innerHTML = `
    <h2 style="text-align:center;">GST TAX INVOICE</h2>

    <p><b>${HOTEL.name}</b><br/>
    ${HOTEL.address1}<br/>
    GSTIN: ${HOTEL.gstin}</p>

    <hr/>

    <p>
      <b>Invoice No:</b> ${gstForm.gst_bill_no || "-"}<br/>
      <b>Guest:</b> ${guest.name || "-"}<br/>
      <b>Company:</b> ${gstForm.guest_company_name || "-"}<br/>
      <b>Guest GSTIN:</b> ${gstForm.guest_gst_no || "-"}
    </p>

    <p>
      <b>Stay:</b>
      ${format(new Date(stay.check_in_date), "dd MMM yyyy")}
      –
      ${format(new Date(stay.check_out_date || stay.probable_check_out_date), "dd MMM yyyy")}
    </p>

    <table border="1" width="100%" cellspacing="0" cellpadding="6">
      <tr>
        <th align="left">Description</th>
        <th align="right">Amount</th>
      </tr>
      <tr>
        <td>Room Charges (Base)</td>
        <td align="right">₹${calc.net_price.toFixed(2)}</td>
      </tr>
      <tr>
        <td>GST (${HOTEL.taxRatePct}%)</td>
        <td align="right">₹${calc.gst_price.toFixed(2)}</td>
      </tr>
      <tr>
        <td><b>Total Paid</b></td>
        <td align="right"><b>₹${calc.paid.toFixed(2)}</b></td>
      </tr>
    </table>

    <p style="margin-top:20px;">
      This is a computer-generated GST invoice.
    </p>
  `;

  document.body.appendChild(invoiceHtml);
  const canvas = await html2canvas(invoiceHtml, { scale: 2 });
  document.body.removeChild(invoiceHtml);

  const imgData = canvas.toDataURL("image/png");

  const message = encodeURIComponent(
    `Dear ${guest.name || "Guest"},\n\nPlease find your GST Invoice from *${HOTEL.name}*.\n\nThank you.`
  );

  const whatsappLink = phone
    ? `https://api.whatsapp.com/send/?phone=91${phone}&text=${message}`
    : null;

  return { imgData, whatsappLink };
}
