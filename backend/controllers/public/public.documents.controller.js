// src/controllers/public/public.documents.controller.js
import pool from "../../config/db.js";
import { sendDocumentReceivedEmail } from "../../utils/documentEmails.js";
import { notifyAdminsOfNewDocumentRequest } from "../../utils/notifyAdmins.js";

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
    // ✅ Auto-link request to account if email is already registered
    if (!userId) {
      const [[existingUser]] = await pool.query(
        `SELECT id FROM users WHERE email = ?`,
        [cleanEmail]
      );
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    // 🛑 Check duplicate active request
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

    // 📧 send email notification (non-blocking)
    sendDocumentReceivedEmail(cleanEmail, {
      name: full_name,
      documentType: document_type,
      purpose,
      copies,
      requestCode,
    }).catch((e) => console.warn("⚠️ Email send failed:", e.message));

    notifyAdminsOfNewDocumentRequest(
      full_name,
      document_type,
      result.insertId
    ).catch((e) => console.warn("⚠️ Admin notify failed:", e.message));

    return res.status(201).json({
      success: true,
      message:
        "Your document request has been submitted successfully. Please log in using the same email to view its status.",
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

export async function fetchPublicDocumentRequests(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "You need to log in to view your document requests.",
      });
    }

    // 🧠 Optional auto-linking: convert guest requests to user-owned on login
    const [[user]] = await pool.query(`SELECT email FROM users WHERE id = ?`, [userId]);
    const accountEmail = user?.email;

    if (accountEmail) {
      await pool.query(
        `
        UPDATE document_requests
        SET user_id = ?
        WHERE user_id IS NULL AND email = ?
        `,
        [userId, accountEmail]
      );
    }

    // 📥 Now fetch all requests tied to user_id
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        request_code,
        full_name,
        email,
        phone,
        address,
        document_type,
        purpose,
        copies,
        additional_info,
        status,
        created_at
      FROM document_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("❌ fetchPublicDocumentRequests error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch document requests. Please try again later.",
    });
  }
}
