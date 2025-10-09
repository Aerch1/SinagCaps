// src/utils/email/documentEmails.js
import { transporter } from "../config/nodemailer.js";
import {
  DOCUMENT_RECEIVED_TEMPLATE,
  DOCUMENT_PROCESSING_TEMPLATE,
  DOCUMENT_READY_TEMPLATE,
  DOCUMENT_REJECTED_TEMPLATE,
} from "../config/documentEmailTemplates.js";

const FROM = `"Our Lady of Peace and Good Voyage Parish" <${
  process.env.EMAIL_FROM || process.env.EMAIL_USER
}>`;

/* ==========================================================
   📩 Document Request Received
========================================================== */
export const sendDocumentReceivedEmail = async (email, data) => {
  try {
    const html = DOCUMENT_RECEIVED_TEMPLATE.replaceAll("{name}", data.name)
      .replaceAll("{documentType}", data.documentType)
      .replaceAll("{purpose}", data.purpose)
      .replaceAll("{copies}", data.copies || 1)
      .replaceAll("{requestCode}", data.requestCode);

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "We’ve Received Your Document Request",
      html,
    });

    console.log("✅ Document received email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending document received email:", error);
    throw new Error(`Failed to send document received email: ${error.message}`);
  }
};

/* ==========================================================
   ⚙️ Document Processing
========================================================== */
export const sendDocumentProcessingEmail = async (email, data) => {
  try {
    const html = DOCUMENT_PROCESSING_TEMPLATE.replaceAll(
      "{name}",
      data.name
    ).replaceAll("{documentType}", data.documentType);

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Your Document Request is Now Being Processed",
      html,
    });

    console.log("✅ Document processing email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending document processing email:", error);
    throw new Error(`Failed to send processing email: ${error.message}`);
  }
};

/* ==========================================================
   📦 Document Ready for Pick-Up
========================================================== */
export const sendDocumentReadyEmail = async (email, data) => {
  try {
    const html = DOCUMENT_READY_TEMPLATE.replaceAll("{name}", data.name)
      .replaceAll("{documentType}", data.documentType)
      .replaceAll("{requestCode}", data.requestCode);

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Your Document is Ready for Pick-Up",
      html,
    });

    console.log("✅ Document ready email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending document ready email:", error);
    throw new Error(`Failed to send ready email: ${error.message}`);
  }
};

/* ==========================================================
   ❌ Document Rejected
========================================================== */
export const sendDocumentRejectedEmail = async (email, data) => {
  try {
    const html = DOCUMENT_REJECTED_TEMPLATE.replaceAll("{name}", data.name)
      .replaceAll("{documentType}", data.documentType)
      .replaceAll("{reason}", data.reason || "No reason provided");

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Your Document Request Has Been Rejected",
      html,
    });

    console.log("✅ Document rejected email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending document rejected email:", error);
    throw new Error(`Failed to send rejection email: ${error.message}`);
  }
};
