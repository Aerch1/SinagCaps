import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

/* =====================================================
   📤 Create Document Request (Public or Logged-in)
===================================================== */
export async function createPublicDocumentRequest(req, res) {
  const {
    full_name,
    email,
    phone,
    address,
    documents, // <-- now array of document objects
    additional_info,
  } = req.body;

  const cleanEmail = email?.trim().toLowerCase();
  let userId = req.userId || null;

  // 🧾 Basic Validation
  if (
    !full_name ||
    !cleanEmail ||
    !documents ||
    !Array.isArray(documents) ||
    documents.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: "Full name, email, and at least one document are required.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid email address.",
    });
  }

  // Validate each document
  for (const doc of documents) {
    if (!doc.document_type || !doc.purpose) {
      return res.status(400).json({
        success: false,
        error: "Each document must have a type and purpose.",
      });
    }
    const numCopies = doc.copies ? Number(doc.copies) : 1;
    if (isNaN(numCopies) || numCopies < 1 || numCopies > 10) {
      return res.status(400).json({
        success: false,
        error: `Copies for ${doc.document_type} must be between 1 and 10.`,
      });
    }
    doc.copies = numCopies; // normalize
  }

  const requestCode = `REQ-${Date.now()}`;

  try {
    // ✅ Auto-link if logged in OR email exists in DB
    if (!userId) {
      const [[existingUser]] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [cleanEmail]
      );
      if (existingUser) userId = existingUser.id;
    }

    // 🚨 Prevent duplicate active requests for same document type
    // 📝 Skip duplication check for 'other'
    for (const doc of documents) {
      if (doc.document_type !== "other") {
        const [existing] = await pool.query(
          `
          SELECT id FROM document_requests
          WHERE JSON_CONTAINS(documents, JSON_OBJECT('document_type', ?))
          AND (user_id = ? OR email = ?)
          AND status IN ('pending', 'processing', 'approved')
          LIMIT 1
          `,
          [doc.document_type, userId, cleanEmail]
        );
        if (existing.length > 0) {
          return res.status(400).json({
            success: false,
            error: `You already have an active request for ${doc.document_type}.`,
          });
        }
      }
    }

    // 🗃️ Insert new document request
    const [result] = await pool.query(
      `
      INSERT INTO document_requests
      (request_code, user_id, full_name, email, phone, address, documents, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requestCode,
        userId,
        full_name.trim(),
        cleanEmail,
        phone?.trim() || null,
        address?.trim() || null,
        JSON.stringify(documents),
        additional_info?.trim() || null,
      ]
    );

    const insertedId = result.insertId;

    // 📧 Send confirmation email (non-blocking)
    for (const doc of documents) {
      sendDocumentReceivedEmail(cleanEmail, {
        name: full_name,
        documentType: doc.document_type,
        purpose: doc.purpose,
        copies: doc.copies,
        requestCode,
      }).catch((e) =>
        console.warn(`⚠️ Email failed to ${cleanEmail}: ${e.message}`)
      );
    }

    // 🔔 Notify admins (non-blocking)
    for (const doc of documents) {
      notifyAdminsOfNewDocumentRequest(
        full_name,
        doc.document_type,
        insertedId
      ).catch((e) =>
        console.warn(`⚠️ Admin notification failed: ${e.message}`)
      );
    }

    return res.status(201).json({
      success: true,
      message: "Your document request has been submitted successfully.",
      id: insertedId,
      request_code: requestCode,
    });
  } catch (err) {
    console.error("❌ [createPublicDocumentRequest] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to submit document request. Please try again later.",
    });
  }
}

/* =====================================================
   📥 Get My Document Requests
   — Auto-link guest requests to account on login
===================================================== */
export async function getMyDocumentRequests(req, res) {
  const userId = req.userId;
  let userEmail = req.userEmail?.toLowerCase() || null;

  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    if (!userEmail) {
      const [[user]] = await pool.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );
      userEmail = user?.email || null;
    }

    if (userEmail) {
      await pool.query(
        `
        UPDATE document_requests
        SET user_id = ?
        WHERE email = ? AND user_id IS NULL
        `,
        [userId, userEmail]
      );
    }

    const [rows] = await pool.query(
      `
      SELECT 
        id,
        request_code,
        documents,
        status,
        created_at
      FROM document_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.json({ success: true, requests: rows });
  } catch (err) {
    console.error("❌ [getMyDocumentRequests] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document requests.",
    });
  }
}

/* =====================================================
   📄 Get Single Document Request
===================================================== */
export async function getMyDocumentRequestDetails(req, res) {
  const userId = req.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const [[row]] = await pool.query(
      `
      SELECT 
        id,
        request_code,
        documents,
        additional_info,
        status,
        created_at
      FROM document_requests
      WHERE id = ? AND user_id = ?
      `,
      [id, userId]
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        error: "Document request not found.",
      });
    }

    return res.json({ success: true, request: row });
  } catch (err) {
    console.error("❌ [getMyDocumentRequestDetails] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document request details.",
    });
  }
}
