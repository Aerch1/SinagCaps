import pool from "../../config/db.js";
import { createNotification } from "../../utils/createNotification.js";
import {
  sendDocumentReceivedEmail,
  sendDocumentProcessingEmail,
  sendDocumentReadyEmail,
  sendDocumentRejectedEmail,
} from "../../utils/documentEmails.js";

/* ======================================================
   📜 Get all document requests
====================================================== */
export async function getAllDocumentRequests(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
         dr.*, 
         u.name AS userName, 
         u.email AS userEmail
       FROM document_requests dr
       LEFT JOIN users u ON dr.user_id = u.id
       ORDER BY dr.created_at DESC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ getAllDocumentRequests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch document requests",
    });
  }
}

/* ======================================================
   ➕ Create a new document request (Admin only)
====================================================== */
export async function createDocumentRequest(req, res) {
  const {
    user_id,
    full_name,
    email,
    phone,
    address,
    document_type,
    purpose,
    copies,
    additional_info,
  } = req.body;

  if (!full_name || !email || !document_type || !purpose) {
    return res.status(400).json({
      success: false,
      error:
        "Full name, email, document type, and purpose are required fields.",
    });
  }

  try {
    const requestCode = `REQ-${Date.now()}`;

    const [result] = await pool.query(
      `
      INSERT INTO document_requests
      (request_code, user_id, full_name, email, phone, address, document_type, purpose, copies, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requestCode,
        user_id || null,
        full_name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        address?.trim() || null,
        document_type,
        purpose?.trim(),
        copies && !isNaN(copies) ? Number(copies) : 1,
        additional_info?.trim() || null,
      ]
    );

    // ✅ Send acknowledgment email to requester
    try {
      await sendDocumentReceivedEmail(email, {
        name: full_name,
        documentType: document_type,
        purpose,
        copies,
        requestCode,
      });
      console.log(`✅ Acknowledgment email sent to ${email}`);
    } catch (mailErr) {
      console.warn("⚠️ Failed to send received email:", mailErr.message);
    }

    res.json({
      success: true,
      id: result.insertId,
      request_code: requestCode,
      message: "Document request created successfully",
    });
  } catch (error) {
    console.error("❌ createDocumentRequest error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create document request",
    });
  }
}

/* ======================================================
   ✏️ Update document request status (Admin)
====================================================== */
export async function updateDocumentStatus(req, res) {
  const { id } = req.params;
  const { status, reason = "" } = req.body;

  try {
    const [[doc]] = await pool.query(
      `SELECT user_id, full_name, email, document_type, request_code 
       FROM document_requests WHERE id = ?`,
      [id]
    );

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Document request not found" });
    }

    await pool.query(`UPDATE document_requests SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);

    // ✅ Send emails + user notifications based on status
    if (status === "processing") {
      try {
        await sendDocumentProcessingEmail(doc.email, {
          name: doc.full_name,
          documentType: doc.document_type,
        });

        await createNotification({
          user_id: doc.user_id,
          title: "Your Document Request is Now Being Processed",
          message: `Hi ${doc.full_name}, your ${doc.document_type} request is being processed.`,
          type: "document",
          reference_id: id,
        });
      } catch (err) {
        console.warn("⚠️ Failed to send processing updates:", err.message);
      }
    }

    if (status === "completed") {
      try {
        await sendDocumentReadyEmail(doc.email, {
          name: doc.full_name,
          documentType: doc.document_type,
          requestCode: doc.request_code,
        });

        await createNotification({
          user_id: doc.user_id,
          title: "Your Document Request is Ready for Pick-Up",
          message: `Hi ${doc.full_name}, your ${doc.document_type} certificate is ready for pick-up.`,
          type: "document",
          reference_id: id,
        });
      } catch (err) {
        console.warn("⚠️ Failed to send completion updates:", err.message);
      }
    }

    if (status === "rejected") {
      try {
        await sendDocumentRejectedEmail(doc.email, {
          name: doc.full_name,
          documentType: doc.document_type,
          reason,
        });

        await createNotification({
          user_id: doc.user_id,
          title: "Your Document Request Has Been Rejected",
          message: `We’re sorry, but your ${doc.document_type} request was rejected. Reason: ${reason}`,
          type: "document",
          reference_id: id,
        });
      } catch (err) {
        console.warn("⚠️ Failed to send rejection updates:", err.message);
      }
    }

    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.error("❌ updateDocumentStatus error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update document status",
    });
  }
}

/* ======================================================
   🗑️ Delete a document request
====================================================== */
export async function deleteDocumentRequest(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM document_requests WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    res.json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    console.error("❌ deleteDocumentRequest error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete document request",
    });
  }
}
