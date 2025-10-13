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
    document_type,
    purpose,
    copies,
    additional_info,
  } = req.body;

  const cleanEmail = email?.trim().toLowerCase();
  let userId = req.userId || null;

  // 🧾 Basic Validation
  if (!full_name || !cleanEmail || !document_type || !purpose) {
    return res.status(400).json({
      success: false,
      error: "Full name, email, document type, and purpose are required.",
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
    // ✅ Auto-link if logged in OR email exists in DB
    if (!userId) {
      const [[existingUser]] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [cleanEmail]
      );
      if (existingUser) userId = existingUser.id;
    }

    // 🚨 Prevent duplicate active requests for same document type
    // 📝 Skip duplication check if document_type === 'other'
    if (document_type !== "other") {
      const [existing] = await pool.query(
        `
        SELECT id FROM document_requests
        WHERE document_type = ?
        AND (user_id = ? OR email = ?)
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
    }

    // 🗃️ Insert new document request
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
        purpose.trim(),
        numCopies,
        additional_info?.trim() || null,
      ]
    );

    const insertedId = result.insertId;

    // 📧 Send confirmation email (non-blocking)
    sendDocumentReceivedEmail(cleanEmail, {
      name: full_name,
      documentType: document_type,
      purpose,
      copies: numCopies,
      requestCode,
    }).catch((e) =>
      console.warn(`⚠️ Email failed to ${cleanEmail}: ${e.message}`)
    );

    // 🔔 Notify admins (non-blocking)
    notifyAdminsOfNewDocumentRequest(
      full_name,
      document_type,
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
   — Auto-link guest requests to account on login
===================================================== */
export async function getMyDocumentRequests(req, res) {
  const userId = req.userId;
  let userEmail = req.userEmail?.toLowerCase() || null;

  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    // 🛡️ Fallback: if token has no email (e.g. old tokens), fetch from DB
    if (!userEmail) {
      const [[user]] = await pool.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );
      userEmail = user?.email || null;
    }

    if (userEmail) {
      // 🧠 Link past guest requests if they used this email before
      await pool.query(
        `
        UPDATE document_requests
        SET user_id = ?
        WHERE email = ? AND user_id IS NULL
        `,
        [userId, userEmail]
      );
    }

    // 🧾 Fetch all requests made under this account
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        request_code,
        document_type,
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
        document_type,
        purpose,
        copies,
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
