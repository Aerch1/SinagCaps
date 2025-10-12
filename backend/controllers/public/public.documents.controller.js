// src/controllers/public/public.documents.controller.js
import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

/* =====================================================
   📤 Create Document Request (Public or Logged-in)
   — If logged in → store user_id + email
   — If guest → store email only
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

  const cleanEmail = email?.trim().toLowerCase();
  let userId = req.userId || null;

  // ✅ Basic Validation
  if (!full_name || !cleanEmail || !document_type || !purpose) {
    return res.status(400).json({
      success: false,
      error: "Full name, email, document type, and purpose are required.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid email address.",
    });
  }

  if (copies && (isNaN(copies) || copies < 1 || copies > 10)) {
    return res.status(400).json({
      success: false,
      error: "Copies must be between 1 and 10.",
    });
  }

  const requestCode = `REQ-${Date.now()}`;

  try {
    // 👤 Auto-link guest requests to existing account if email already registered
    if (!userId) {
      const [[existingUser]] = await pool.query(
        `SELECT id FROM users WHERE email = ?`,
        [cleanEmail]
      );
      if (existingUser) userId = existingUser.id;
    }

    // 🚨 Check for duplicate active request
    const [existing] = await pool.query(
      `
      SELECT id FROM document_requests
      WHERE document_type = ?
      AND (
        (user_id IS NOT NULL AND user_id = ?) 
        OR email = ?
      )
      AND status IN ('pending', 'processing', 'approved')
      LIMIT 1
      `,
      [document_type, userId, cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `You already have an active request for ${document_type}.`,
      });
    }

    // 📝 Insert document request
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
        cleanEmail,
        phone?.trim() || null,
        address?.trim() || null,
        document_type,
        purpose?.trim(),
        copies ? Number(copies) : 1,
        additional_info?.trim() || null,
      ]
    );

    const insertedId = result.insertId;

    // 📧 Send confirmation email (non-blocking)
    sendDocumentReceivedEmail(cleanEmail, {
      name: full_name,
      documentType: document_type,
      purpose,
      copies,
      requestCode,
    }).catch((e) =>
      console.warn(`⚠️ Email failed to ${cleanEmail}:`, e.message)
    );

    // 🔔 Notify admins (non-blocking)
    notifyAdminsOfNewDocumentRequest(
      full_name,
      document_type,
      insertedId
    ).catch((e) => console.warn(`⚠️ Admin notification failed:`, e.message));

    return res.status(201).json({
      success: true,
      message: "Your document request has been submitted successfully.",
      id: insertedId,
      request_code: requestCode,
    });
  } catch (err) {
    console.error("❌ createPublicDocumentRequest error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to submit document request. Please try again later.",
    });
  }
}

/* =====================================================
   📥 Get My Document Requests
   — If logged in → fetch by user_id OR their email
   — If guest → use ?email=query
===================================================== */
export async function getMyDocumentRequests(req, res) {
  try {
    const userId = req.userId || null;
    const emailQuery = req.query.email?.trim().toLowerCase();

    if (!userId && !emailQuery) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized or missing email.",
      });
    }

    let sql = `
      SELECT id, request_code, document_type, status, created_at
      FROM document_requests
      WHERE
    `;
    const params = [];

    if (userId) {
      const [[user]] = await pool.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );
      sql += "(user_id = ? OR email = ?)";
      params.push(userId, user.email);
    } else {
      sql += "email = ?";
      params.push(emailQuery);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, params);

    return res.json({
      success: true,
      requests: rows,
    });
  } catch (err) {
    console.error("❌ getMyDocumentRequests error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document requests.",
    });
  }
}

/* =====================================================
   📄 Get Single Document Request
   — If logged in → user_id OR email
   — If guest → ?email=query
===================================================== */
export async function getMyDocumentRequestDetails(req, res) {
  try {
    const userId = req.userId || null;
    const emailQuery = req.query.email?.trim().toLowerCase();
    const { id } = req.params;

    if (!userId && !emailQuery) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized or missing email.",
      });
    }

    let sql = `
      SELECT id, request_code, document_type, purpose, copies, additional_info, status, created_at
      FROM document_requests
      WHERE id = ?
      AND
    `;
    const params = [id];

    if (userId) {
      const [[user]] = await pool.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );
      sql += "(user_id = ? OR email = ?)";
      params.push(userId, user.email);
    } else {
      sql += "email = ?";
      params.push(emailQuery);
    }

    const [[row]] = await pool.query(sql, params);

    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: "Document request not found." });
    }

    return res.json({ success: true, request: row });
  } catch (err) {
    console.error("❌ getMyDocumentRequestDetails error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document request details.",
    });
  }
}
