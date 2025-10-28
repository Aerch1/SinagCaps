import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

/* =====================================================
   📤 Create Document Request (Public or Logged-in)
   — Supports multiple document types (stored as JSON)
===================================================== */
export async function createPublicDocumentRequest(req, res) {
  const {
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

  // 🧾 Basic validation
  if (
    !full_name ||
    !cleanEmail ||
    !Array.isArray(document_types) ||
    document_types.length === 0 ||
    !purpose
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Full name, email, at least one document type, and purpose are required.",
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
    console.log("📨 [createPublicDocumentRequest] Payload:", req.body);

    // ✅ Auto-link to existing user account by email (if logged in or previously registered)
    if (!userId) {
      const [[existingUser]] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [cleanEmail]
      );
      if (existingUser) userId = existingUser.id;
    }

    // 🚫 Prevent duplicate active requests for same document type (except "other")
    for (const docType of document_types) {
      if (docType === "other") continue;

      const [existing] = await pool.query(
        `
        SELECT id FROM document_requests
        WHERE JSON_CONTAINS(document_type, JSON_QUOTE(?))
        AND (email = ? OR (user_id IS NOT NULL AND user_id = ?))
        AND status IN ('pending', 'processing', 'approved')
        LIMIT 1
        `,
        [docType, cleanEmail, userId]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `You already have an active request for ${docType}.`,
        });
      }
    }

    // 🗃️ Save as JSON
    const documentTypeJSON = JSON.stringify(document_types);

    // 💾 Insert request
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
        documentTypeJSON,
        purpose.trim(),
        numCopies,
        additional_info?.trim() || null,
      ]
    );

    const insertedId = result.insertId;

    // 📧 Confirmation email (async)
    const docList = document_types.join(", ");
    sendDocumentReceivedEmail(cleanEmail, {
      name: full_name,
      documentType: docList,
      purpose,
      copies: numCopies,
      requestCode,
    }).catch((e) => console.warn(`⚠️ Email failed to ${cleanEmail}: ${e.message}`));

    // 🔔 Notify admins (async)
    notifyAdminsOfNewDocumentRequest(full_name, docList, insertedId).catch(
      (e) => console.warn(`⚠️ Admin notification failed: ${e.message}`)
    );

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
    // 🛡️ Get email if missing
    if (!userEmail) {
      const [[user]] = await pool.query("SELECT email FROM users WHERE id = ?", [
        userId,
      ]);
      userEmail = user?.email || null;
    }

    // 🔄 Link past guest requests using this email
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

    // 📦 Fetch all requests tied to this user
    const [rows] = await pool.query(
      `
      SELECT id, request_code, document_type, status, created_at
      FROM document_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    // 🧠 Parse JSON before returning
    const parsed = rows.map((r) => ({
      ...r,
      document_type: JSON.parse(r.document_type || "[]"),
    }));

    return res.json({ success: true, requests: parsed });
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
      SELECT id, request_code, document_type, purpose, copies,
             additional_info, status, created_at
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

    // 🧠 Parse document_type JSON
    row.document_type = JSON.parse(row.document_type || "[]");

    return res.json({ success: true, request: row });
  } catch (err) {
    console.error("❌ [getMyDocumentRequestDetails] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document request details.",
    });
  }
}
