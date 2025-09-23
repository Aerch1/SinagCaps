// src/controllers/public/appointments.controller.js
import pool from "../../config/db.js";

/* ---------------- POST /api/public/appointments ---------------- */
export const createAppointmentPublic = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      name,
      email,
      contactNumber,
      serviceType,
      date,
      time,
      party_size = 1,
      notes = "",
      details = {}, // service-specific info
    } = req.body;

    if (!name || !email || !serviceType || !date || !time) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO appointments 
         (user_id, name, email, contactNumber, serviceType, date, time, party_size, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        req.userId || null,
        name,
        email,
        contactNumber || null,
        serviceType,
        date,
        time,
        party_size,
        notes,
      ]
    );
    const appointmentId = result.insertId;

    // 🔹 Insert into detail tables
    if (serviceType === "Baptism") {
      await conn.query(
        `INSERT INTO baptism_details (appointment_id, childFullName, childDob, childBirthplace, fatherName, motherMaidenName, parentsMarriageType, sponsors)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentId,
          details.childFullName || null,
          details.childDob || null,
          details.childBirthplace || null,
          details.fatherName || null,
          details.motherMaidenName || null,
          details.parentsMarriageType || null,
          JSON.stringify(details.sponsors || []),
        ]
      );
    }
    if (serviceType === "Wedding") {
      await conn.query(
        `INSERT INTO wedding_details (appointment_id, marriageLicense, baptismCertificates, seminarAttendance)
         VALUES (?, ?, ?, ?)`,
        [
          appointmentId,
          details.marriageLicense || null,
          JSON.stringify(details.baptismCertificates || []),
          details.seminarAttendance ? 1 : 0,
        ]
      );
    }
    if (serviceType === "Funeral") {
      await conn.query(
        `INSERT INTO funeral_details (appointment_id, deathCertificate, parishClearance)
         VALUES (?, ?, ?)`,
        [
          appointmentId,
          details.deathCertificate || null,
          details.parishClearance || null,
        ]
      );
    }
    if (serviceType === "Counseling") {
      await conn.query(
        `INSERT INTO counseling_details (appointment_id, counselorName, topics)
         VALUES (?, ?, ?)`,
        [
          appointmentId,
          details.counselorName || null,
          JSON.stringify(details.topics || []),
        ]
      );
    }
    if (serviceType === "Confirmation") {
      await conn.query(
        `INSERT INTO confirmation_details (appointment_id, sponsorName, baptismalCert)
         VALUES (?, ?, ?)`,
        [
          appointmentId,
          details.sponsorName || null,
          details.baptismalCert || null,
        ]
      );
    }
    if (serviceType === "Document Request") {
      await conn.query(
        `INSERT INTO document_request_details (appointment_id, documentType, purpose)
         VALUES (?, ?, ?)`,
        [appointmentId, details.documentType || null, details.purpose || null]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Appointment submitted successfully",
      appointmentId,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ createAppointmentPublic error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit appointment" });
  } finally {
    if (conn) conn.release();
  }
};

/* ---------------- GET /api/public/appointments/:email ---------------- */
export const getAppointmentsByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await pool.query(
      `SELECT 
         id, name, email, contactNumber, serviceType, status,
         DATE_FORMAT(date, '%Y-%m-%d') AS date, time, notes
       FROM appointments
       WHERE email = ?
       ORDER BY date DESC, time DESC`,
      [email]
    );

    res.json({ success: true, appointments: rows });
  } catch (err) {
    console.error("❌ getAppointmentsByEmail error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointments" });
  }
};
