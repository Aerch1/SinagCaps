import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

/* =====================================================
   📤 Create Document Request (Public / Logged-in or Guest)
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

  // 🧾 Validation
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

  const requestCode = `REQ-${Date.now()}`;
  let userId = req.userId || null;
  const cleanEmail = email.trim().toLowerCase();

  try {
    /* 🧠 Auto-link guest request to account (if any) */
    if (!userId) {
      const [[existingUser]] = await pool.query(
        `SELECT id FROM users WHERE email = ?`,
        [cleanEmail]
      );
      if (existingUser) userId = existingUser.id;
    }

    /* 🚨 Prevent duplicate active requests for same doc type */
    const [existingReq] = await pool.query(
      `
      SELECT id FROM document_requests
      WHERE document_type = ?
      AND (user_id = ? OR email = ?)
      AND status IN ('pending','processing','approved')
      LIMIT 1
      `,
      [document_type, userId, cleanEmail]
    );

    if (existingReq.length > 0) {
      return res.status(400).json({
        success: false,
        error: `You already have an active request for this document type.`,
      });
    }

    /* 🗃️ Insert request */
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

    /* 📧 Confirmation Email */
    try {
      await sendDocumentReceivedEmail(cleanEmail, {
        name: full_name,
        documentType: document_type,
        purpose,
        copies,
        requestCode,
      });
      console.log(`✅ Document confirmation email sent to ${cleanEmail}`);
    } catch (mailErr) {
      console.warn(`⚠️ Failed to send email to ${cleanEmail}:`, mailErr.message);
    }

    /* 🔔 Notify Admins */
    try {
      await notifyAdminsOfNewDocumentRequest(full_name, document_type, insertedId);
    } catch (notifyErr) {
      console.warn(`⚠️ Failed to notify admins:`, notifyErr.message);
    }

    /* ✅ Response */
    res.status(201).json({
      success: true,
      message: "Your document request has been submitted successfully.",
      id: insertedId,
      request_code: requestCode,
    });
  } catch (err) {
    console.error("❌ createPublicDocumentRequest error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to submit document request. Please try again later.",
    });
  }
}

/* =====================================================
   📥 Get My Document Requests (Preview)
   🅾 Option 3: user_id OR email
===================================================== */
export async function getMyDocumentRequests(req, res) {
  const userId = req.userId || null;
  const userEmail = req.userEmail || null;
  const emailForQuery = userEmail ? userEmail.toLowerCase() : null;

  if (!userId && !userEmail) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        request_code,
        document_type,
        status,
        created_at
      FROM document_requests
      WHERE (user_id = ? OR email = ?)
      ORDER BY created_at DESC
      `,
      [userId, emailForQuery]
    );

    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error("❌ getMyDocumentRequests error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch document requests.",
    });
  }
}

/* =====================================================
   📄 Get Single Document Request (Full Details)
   🅾 Option 3: user_id OR email
===================================================== */
export async function getMyDocumentRequestDetails(req, res) {
  const userId = req.userId || null;
  const userEmail = req.userEmail || null;
  const emailForQuery = userEmail ? userEmail.toLowerCase() : null;
  const { id } = req.params;

  if (!userId && !userEmail) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    const [[row]] = await pool.query(
      `
      SELECT 
        id,
        request_code,
        document_type,
        purpose,
        copies,
        additional_info,
        status,
        created_at
      FROM document_requests
      WHERE id = ? AND (user_id = ? OR email = ?)
      `,
      [id, userId, emailForQuery]
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        error: "Document request not found.",
      });
    }

    res.json({ success: true, request: row });
  } catch (err) {
    console.error("❌ getMyDocumentRequestDetails error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch document request details.",
    });
  }
}
