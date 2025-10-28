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

    // ✅ Parse JSON array for document_type (for consistent frontend handling)
    const parsedRows = rows.map((r) => ({
      ...r,
      document_type: (() => {
        try {
          return JSON.parse(r.document_type);
        } catch {
          return r.document_type; // fallback if old single-type data
        }
      })(),
    }));

    res.json({ success: true, data: parsedRows });
  } catch (err) {
    console.error("❌ getAllDocumentRequests error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch document requests",
    });
  }
}

/* ======================================================
   ➕ Create a new document request (Admin)
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

  const requestCode = `REQ-${Date.now()}`;

  try {
    // ✅ Ensure we store multiple document types as JSON
    const formattedType = Array.isArray(document_type)
      ? JSON.stringify(document_type)
      : JSON.stringify([document_type]);

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
        formattedType,
        purpose?.trim(),
        copies && !isNaN(copies) ? Number(copies) : 1,
        additional_info?.trim() || null,
      ]
    );

    // 📨 Send acknowledgment email
    try {
      await sendDocumentReceivedEmail(email, {
        name: full_name,
        documentType: Array.isArray(document_type)
          ? document_type.join(", ")
          : document_type,
        purpose,
        copies,
        requestCode,
      });
      console.log(`✅ Document received email sent to ${email}`);
    } catch (mailErr) {
      console.warn(
        `⚠️ Failed to send received email to ${email}:`,
        mailErr.message
      );
    }

    res.json({
      success: true,
      id: result.insertId,
      request_code: requestCode,
      message: "Document request created successfully",
    });
  } catch (err) {
    console.error("❌ createDocumentRequest error:", err);
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

    // ✅ Parse JSON document_type safely
    let parsedType;
    try {
      parsedType = JSON.parse(doc.document_type);
    } catch {
      parsedType = doc.document_type;
    }

    const docTypeLabel = Array.isArray(parsedType)
      ? parsedType.join(", ")
      : parsedType;

    await pool.query(`UPDATE document_requests SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);

    // ✅ Send emails & notifications per status
    if (status === "processing") {
      try {
        await sendDocumentProcessingEmail(doc.email, {
          name: doc.full_name,
          documentType: docTypeLabel,
        });

        if (doc.user_id) {
          await createNotification({
            user_id: doc.user_id,
            title: "Your Document Request is Now Being Processed",
            message: `Hi ${doc.full_name}, your ${docTypeLabel} request is being processed.`,
            type: "document",
            reference_id: id,
          });
        }

        console.log(`✅ Processing email sent to ${doc.email}`);
      } catch (err) {
        console.warn(
          `⚠️ Failed to send processing updates to ${doc.email}:`,
          err.message
        );
      }
    }

    if (status === "completed") {
      try {
        await sendDocumentReadyEmail(doc.email, {
          name: doc.full_name,
          documentType: docTypeLabel,
          requestCode: doc.request_code,
        });

        if (doc.user_id) {
          await createNotification({
            user_id: doc.user_id,
            title: "Your Document Request is Ready for Pick-Up",
            message: `Hi ${doc.full_name}, your ${docTypeLabel} certificate is ready for pick-up.`,
            type: "document",
            reference_id: id,
          });
        }

        console.log(`✅ Completion email sent to ${doc.email}`);
      } catch (err) {
        console.warn(
          `⚠️ Failed to send completion updates to ${doc.email}:`,
          err.message
        );
      }
    }

    if (status === "rejected") {
      try {
        await sendDocumentRejectedEmail(doc.email, {
          name: doc.full_name,
          documentType: docTypeLabel,
          reason,
        });

        if (doc.user_id) {
          await createNotification({
            user_id: doc.user_id,
            title: "Your Document Request Has Been Rejected",
            message: `We’re sorry, but your ${docTypeLabel} request was rejected. Reason: ${reason}`,
            type: "document",
            reference_id: id,
          });
        }

        console.log(`✅ Rejection email sent to ${doc.email}`);
      } catch (err) {
        console.warn(
          `⚠️ Failed to send rejection updates to ${doc.email}:`,
          err.message
        );
      }
    }

    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("❌ updateDocumentStatus error:", err);
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
  } catch (err) {
    console.error("❌ deleteDocumentRequest error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete document request",
    });
  }
}
