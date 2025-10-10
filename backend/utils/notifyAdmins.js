import pool from "../config/db.js";
import { createNotification } from "./createNotification.js";

/**
 * Notify all admins when a new document request is created.
 * @param {string} fullName - Full name of the requester
 * @param {string} documentType - Type of document requested
 * @param {number} referenceId - ID of the document request
 */
export async function notifyAdminsOfNewDocumentRequest(
  fullName,
  documentType,
  referenceId
) {
  try {
    const [admins] = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    if (!admins.length) {
      console.warn("⚠️ No admin accounts found to notify.");
      return;
    }

    // Generate a natural notification message
    const messages = [
      `${fullName} requested a ${documentType} certificate.`,
      `A new ${documentType} document request was created by ${fullName}.`,
      `${fullName} has submitted a ${documentType} request for processing.`,
      `Document request alert: ${fullName} filed a ${documentType} certificate request.`,
    ];
    const adminMessage = messages[Math.floor(Math.random() * messages.length)];

    for (const { id: adminId } of admins) {
      await createNotification({
        user_id: adminId,
        title: "New Document Request Received",
        message: adminMessage,
        type: "document",
        reference_id: referenceId,
      });
    }

    console.log(`✅ Admin notifications sent to ${admins.length} admin(s).`);
  } catch (err) {
    console.warn(
      "⚠️ Failed to notify admins of document request:",
      err.message
    );
  }
}
