import { transporter } from "../config/nodemailer.js";
import {
  APPOINTMENT_UPDATED_TEMPLATE,
  APPOINTMENT_RESCHEDULED_TEMPLATE,
  APPOINTMENT_CANCELLED_TEMPLATE,
} from "../config/appointmentEmailTemplates.js";

const FROM = {
  name: "Parish Appointments",
  address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@example.com";

/* ==========================================================
   Appointment Created
========================================================== */
export async function sendAppointmentCreatedEmail(
  toEmail,
  { name, serviceName, date, time, appointmentId }
) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
        <h2 style="color:#4CAF50;">Appointment Confirmation</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your appointment has been created successfully for:</p>
        <ul>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Transaction ID:</strong> #${appointmentId}</li>
        </ul>
        <p>Please keep this Transaction ID for your reference.</p>
        <p>Best regards,<br/>Our Lady of Peace & Good Voyage Parish Team</p>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: "Appointment Confirmation",
      html,
    });

    console.log("✅ Appointment created email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending appointment created email:", err);
    throw new Error(`Failed to send appointment email: ${err.message}`);
  }
}

/* ==========================================================
   Appointment Status Updated
========================================================== */
export const sendAppointmentUpdatedEmail = async (toEmail, data) => {
  try {
    const html = APPOINTMENT_UPDATED_TEMPLATE.replaceAll("{name}", data.name)
      .replaceAll("{service}", data.serviceName)
      .replaceAll("{status}", data.status)
      .replaceAll("{date}", data.date)
      .replaceAll("{time}", data.time);

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: `Appointment Status Updated – ${data.serviceName}`,
      html,
    });

    console.log("✅ Appointment updated email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending appointment updated email:", err);
    throw new Error(`Failed to send appointment updated email: ${err.message}`);
  }
};

/* ==========================================================
   Appointment Rescheduled
========================================================== */
export const sendAppointmentRescheduledEmail = async (toEmail, data) => {
  try {
    const html = APPOINTMENT_RESCHEDULED_TEMPLATE.replaceAll(
      "{name}",
      data.name
    )
      .replaceAll("{service}", data.serviceName)
      .replaceAll("{oldDate}", data.oldDate)
      .replaceAll("{oldTime}", data.oldTime)
      .replaceAll("{newDate}", data.newDate)
      .replaceAll("{newTime}", data.newTime);

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: `Appointment Rescheduled – ${data.serviceName}`,
      html,
    });

    console.log("✅ Appointment rescheduled email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending appointment rescheduled email:", err);
    throw new Error(
      `Failed to send appointment rescheduled email: ${err.message}`
    );
  }
};

/* ==========================================================
   Appointment Cancelled / Rejected
========================================================== */
export const sendAppointmentCancelledEmail = async (toEmail, data) => {
  try {
    const isRejected = data.status === "rejected";
    const heading = isRejected ? "Rejected" : "Cancelled";
    const statusText = isRejected ? "rejected" : "cancelled";
    const accent = isRejected ? "#F44336" : "#D32F2F"; // reject brighter, cancel deeper

    const html = APPOINTMENT_CANCELLED_TEMPLATE.replaceAll("{accent}", accent)
      .replaceAll("{heading}", heading)
      .replaceAll("{statusText}", statusText)
      .replaceAll("{name}", data.name)
      .replaceAll("{service}", data.serviceName)
      .replaceAll("{date}", data.date || "—")
      .replaceAll("{time}", data.time || "—")
      .replaceAll("{reason}", data.reason || "No reason provided");

    const subject = `Appointment ${heading} – ${data.serviceName}`;

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject,
      html,
      replyTo: SUPPORT_EMAIL,
    });

    console.log(`✅ Appointment ${statusText} email sent:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(
      "❌ Error sending appointment cancelled/rejected email:",
      err
    );
    throw new Error(
      `Failed to send appointment ${data.status} email: ${err.message}`
    );
  }
};
