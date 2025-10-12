// controllers/public/public.documents.controller.js
import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

/* =====================================================
   📤 Create Document Request (Public / Logged-in or Guest)
   ✅ Always attach logged-in userId if available
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

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
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

  try {
    console.log("🧠 [DOC-REQUEST] Incoming create:", {
      loggedInUserId: req.userId || null,
      loggedInUserEmail: req.userEmail || null,
      inputEmail: cleanEmail,
    });

    // ✅ Always prefer logged-in userId
    if (!userId) {
      const [[existingUser]] = await pool.query(
        `SELECT id FROM users WHERE email = ?`,
        [cleanEmail]
      );
      if (existingUser) {
        userId = existingUser.id;
        console.log("🔗 Auto-linked guest request to user:", userId);
      }
    } else {
      console.log("👤 Logged-in user request, using userId:", userId);
    }

    // 📝 Insert
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

    const [[debugRow]] = await pool.query(
      `SELECT id, user_id, email, document_type, status FROM document_requests WHERE id = ?`,
      [insertedId]
    );
    console.log("🪵 [DOC-REQUEST] Inserted row:", debugRow);

    // 📧 Email
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
      console.warn(`⚠️ Failed to send email:`, mailErr.message);
    }

    // 🔔 Notify admins
    try {
      await notifyAdminsOfNewDocumentRequest(
        full_name,
        document_type,
        insertedId
      );
    } catch (notifyErr) {
      console.warn(`⚠️ Failed to notify admins:`, notifyErr.message);
    }

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
   ✅ Fetch all requests by user_id (even if email differs)
===================================================== */
export async function getMyDocumentRequests(req, res) {
  const userId = req.userId;

  console.log("👤 [DOC-REQUEST] Fetch my requests:", { userId });

  if (!userId) {
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
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    console.log(`📄 [DOC-REQUEST] Returned ${rows.length} rows`);
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
   ✅ Secure & linked to logged-in user
===================================================== */
export async function getMyDocumentRequestDetails(req, res) {
  const userId = req.userId;
  const { id } = req.params;

  console.log("👤 [DOC-REQUEST] Fetch single request:", { userId, id });

  if (!userId) {
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
      WHERE id = ? AND user_id = ?
      `,
      [id, userId]
    );

    console.log("📄 [DOC-REQUEST] Single row fetched:", row || "None");

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
