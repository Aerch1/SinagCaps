import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

/* =====================================================
   📤 Create Document Request (Public or Logged-in)
===================================================== */
export async function createPublicDocumentRequest(req, res) {
  let {
    full_name,
    email,
    phone,
    address,
    document_types,
    purpose,
    copies,
    additional_info,
  } = req.body;

  const cleanEmail = email?.trim().toLowerCase();
  let userId = req.userId || null;

  // 🧾 Basic Validation
  if (!full_name || !cleanEmail || !document_types?.length || !purpose) {
    return res.status(400).json({
      success: false,
      error: "Full name, email, document types, and purpose are required.",
    });
  }

  if (!Array.isArray(document_types)) {
    return res.status(400).json({
      success: false,
      error: "Document types must be an array.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid email address.",
    });
  }

  const numCopies = copies ? Number(copies) : 1;
  if (isNaN(numCopies) || numCopies < 1 || numCopies > 10) {
    return res.status(400).json({
      success: false,
      error: "Copies must be between 1 and 10.",
    });
  }

  const requestCode = `REQ-${Date.now()}`;

  try {
    // Auto-link if logged in OR email exists in DB
    if (!userId) {
      const [[existingUser]] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [cleanEmail]
      );
      if (existingUser) userId = existingUser.id;
    }

    // Prevent duplicate active requests for same document types
    for (const docType of document_types) {
      if (docType !== "other") {
        const [existing] = await pool.query(
          `
          SELECT id FROM document_requests
          WHERE JSON_CONTAINS(document_types, ?) 
            AND (user_id = ? OR email = ?)
            AND status IN ('pending', 'processing', 'approved')
          LIMIT 1
          `,
          [JSON.stringify(docType), userId, cleanEmail]
        );

        if (existing.length > 0) {
          return res.status(400).json({
            success: false,
            error: `You already have an active request for ${docType}.`,
          });
        }
      }
    }

    // Insert new document request
    const [result] = await pool.query(
      `
      INSERT INTO document_requests
      (request_code, user_id, full_name, email, phone, address, document_types, purpose, copies, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requestCode,
        userId,
        full_name.trim(),
        cleanEmail,
        phone?.trim() || null,
        address?.trim() || null,
        JSON.stringify(document_types),
        purpose.trim(),
        numCopies,
        additional_info?.trim() || null,
      ]
    );

    const insertedId = result.insertId;

    // Send confirmation email
    sendDocumentReceivedEmail(cleanEmail, {
      name: full_name,
      documentTypes: document_types.join(", "),
      purpose,
      copies: numCopies,
      requestCode,
    }).catch((e) =>
      console.warn(`⚠️ Email failed to ${cleanEmail}: ${e.message}`)
    );

    // Notify admins
    notifyAdminsOfNewDocumentRequest(
      full_name,
      document_types.join(", "),
      insertedId
    ).catch((e) => console.warn(`⚠️ Admin notification failed: ${e.message}`));

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
        `UPDATE document_requests
         SET user_id = ?
         WHERE email = ? AND user_id IS NULL`,
        [userId, userEmail]
      );
    }

    const [rows] = await pool.query(
      `SELECT 
         id,
         request_code,
         document_types,
         status,
         created_at
       FROM document_requests
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const formatted = rows.map((r) => ({
      ...r,
      document_types: r.document_types ? JSON.parse(r.document_types) : [],
    }));

    return res.json({ success: true, requests: formatted });
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
      `SELECT 
         id,
         request_code,
         document_types,
         purpose,
         copies,
         additional_info,
         status,
         created_at
       FROM document_requests
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        error: "Document request not found.",
      });
    }

    row.document_types = row.document_types
      ? JSON.parse(row.document_types)
      : [];

    return res.json({ success: true, request: row });
  } catch (err) {
    console.error("❌ [getMyDocumentRequestDetails] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document request details.",
    });
  }
}
