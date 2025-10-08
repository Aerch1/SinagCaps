import pool from "../../config/db.js";
import { createNotification } from "../../utils/createNotification.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";

/* =====================================================
   📤 Create Document Request (Public / Logged-in)
===================================================== */
export async function createPublicDocumentRequest(req, res) {
  const {
    full_name,
    email,
    phone,
    address,
    document_type,
    purpose,
    copies,
    additional_info,
  } = req.body;

  // 🧾 Basic validation
  if (!full_name || !email || !document_type || !purpose) {
    return res.status(400).json({
      success: false,
      error:
        "Full name, email, document type, and purpose are required fields.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid email address.",
    });
  }

  if (copies && (isNaN(copies) || copies < 1 || copies > 10)) {
    return res.status(400).json({
      success: false,
      error: "Copies must be a number between 1 and 10.",
    });
  }

  const userId = req.userId || null;
  const requestCode = `REQ-${Date.now()}`;

  try {
    /* =====================================================
       🗃️ Insert new document request
    ====================================================== */
    const [result] = await pool.query(
      `
      INSERT INTO document_requests
      (request_code, user_id, full_name, email, phone, address, document_type, purpose, copies, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requestCode,
        userId,
        full_name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        address?.trim() || null,
        document_type,
        purpose?.trim() || null,
        copies ? Number(copies) : 1,
        additional_info?.trim() || null,
      ]
    );

    const insertedId = result.insertId;

    /* =====================================================
       📧 Send confirmation email to requester
    ====================================================== */
    try {
      await sendDocumentReceivedEmail(email, {
        name: full_name,
        documentType: document_type,
        purpose,
        copies,
        requestCode,
      });
      console.log(`✅ Confirmation email sent to ${email}`);
    } catch (mailErr) {
      console.warn("⚠️ Failed to send confirmation email:", mailErr.message);
    }

    /* =====================================================
       🔔 Notify all admins (similar to appointment logic)
    ====================================================== */
    try {
      const [admins] = await pool.query(
        "SELECT id FROM users WHERE role = 'admin'"
      );

      if (admins.length > 0) {
        // Variations for more natural notifications
        const messages = [
          `${full_name} requested a ${document_type} certificate.`,
          `A new ${document_type} document request was created by ${full_name}.`,
          `${full_name} has submitted a ${document_type} request for processing.`,
          `Document request alert: ${full_name} filed a ${document_type} certificate request.`,
        ];

        const adminMessage =
          messages[Math.floor(Math.random() * messages.length)];

        for (const admin of admins) {
          await createNotification({
            user_id: admin.id,
            title: "New Document Request Received",
            message: adminMessage,
            type: "document",
            reference_id: insertedId,
          });
        }

        console.log(`✅ Sent notifications to ${admins.length} admin(s).`);
      } else {
        console.warn("⚠️ No admin accounts found to notify.");
      }
    } catch (notifErr) {
      console.warn("⚠️ Admin notification creation failed:", notifErr.message);
    }

    /* =====================================================
       ✅ Success Response
    ====================================================== */
    res.status(201).json({
      success: true,
      message: "Your document request has been submitted successfully.",
      id: insertedId,
    });
  } catch (error) {
    console.error("❌ createPublicDocumentRequest error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit document request. Please try again later.",
    });
  }
}
