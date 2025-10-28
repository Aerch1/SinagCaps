import { transporter } from "../config/nodemailer.js";
import {
  DOCUMENT_RECEIVED_TEMPLATE,
  DOCUMENT_PROCESSING_TEMPLATE,
  DOCUMENT_READY_TEMPLATE,
  DOCUMENT_REJECTED_TEMPLATE,
} from "../config/documentEmailTemplates.js";

const FROM = {
  name: "Parish Documents",
  address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@example.com";

/* ==========================================================
   Helper: Convert documentTypes array to readable string
========================================================== */
const formatDocumentTypes = (types) => {
  if (!Array.isArray(types)) return types || "Requested Document";

  return types
    .map((type) => {
      switch (type) {
        case "baptism":
          return "Baptism";
        case "confirmation":
          return "Confirmation";
        case "marriage":
          return "Marriage";
        case "first-communion":
          return "First Communion";
        case "death":
          return "Death/Burial";
        case "membership":
          return "Membership";
        case "other":
          return "Other";
        default:
          return type;
      }
    })
    .join(", ");
};

/* ==========================================================
   📩 Document Request Received
========================================================== */
export const sendDocumentReceivedEmail = async (toEmail, data) => {
  try {
    const html = DOCUMENT_RECEIVED_TEMPLATE.replaceAll(
      "{name}",
      data.name || "Valued Guest"
    )
      .replaceAll("{documentType}", formatDocumentTypes(data.documentTypes))
      .replaceAll("{purpose}", data.purpose || "—")
      .replaceAll("{copies}", data.copies || 1)
      .replaceAll("{requestCode}", data.requestCode || "—");

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: "We’ve Received Your Document Request",
      html,
    });

    console.log("✅ Document received email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending document received email:", err);
    throw new Error(`Failed to send document received email: ${err.message}`);
  }
};

/* ==========================================================
   ⚙️ Document Processing
========================================================== */
export const sendDocumentProcessingEmail = async (toEmail, data) => {
  try {
    const html = DOCUMENT_PROCESSING_TEMPLATE.replaceAll(
      "{name}",
      data.name || "Valued Guest"
    ).replaceAll("{documentType}", formatDocumentTypes(data.documentTypes));

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: "Your Document Request is Now Being Processed",
      html,
    });

    console.log("✅ Document processing email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending document processing email:", err);
    throw new Error(`Failed to send processing email: ${err.message}`);
  }
};

/* ==========================================================
   📦 Document Ready for Pick-Up
========================================================== */
export const sendDocumentReadyEmail = async (toEmail, data) => {
  try {
    const html = DOCUMENT_READY_TEMPLATE.replaceAll(
      "{name}",
      data.name || "Valued Guest"
    )
      .replaceAll("{documentType}", formatDocumentTypes(data.documentTypes))
      .replaceAll("{requestCode}", data.requestCode || "—");

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: "Your Document is Ready for Pick-Up",
      html,
    });

    console.log("✅ Document ready email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending document ready email:", err);
    throw new Error(`Failed to send ready email: ${err.message}`);
  }
};

/* ==========================================================
   ❌ Document Rejected
========================================================== */
export const sendDocumentRejectedEmail = async (toEmail, data) => {
  try {
    const html = DOCUMENT_REJECTED_TEMPLATE.replaceAll(
      "{name}",
      data.name || "Valued Guest"
    )
      .replaceAll("{documentType}", formatDocumentTypes(data.documentTypes))
      .replaceAll("{reason}", data.reason || "No reason provided");

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: "Your Document Request Has Been Rejected",
      html,
      replyTo: SUPPORT_EMAIL,
    });

    console.log("✅ Document rejected email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending document rejected email:", err);
    throw new Error(`Failed to send rejection email: ${err.message}`);
  }
};
