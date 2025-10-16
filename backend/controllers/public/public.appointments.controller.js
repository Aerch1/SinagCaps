import pool from "../../config/db.js";
import { sendAppointmentCreatedEmail } from "../../utils/appointmentEmails.js";
import { createNotification } from "../../utils/createNotification.js";

/* ==================================================
   CREATE Public Appointment (Default, Baptism, Kumpil)
================================================== */
export async function createPublicAppointment(req, res) {
  const conn = await pool.getConnection();
  try {
    const {
      service_id,
      name,
      email,
      contactNumber,
      address,
      date,
      time,
      notes = null,

      // Baptism fields
      childFullName,
      childDob,
      childBirthplace,
      fatherName,
      motherMaidenName,
      parentsMarriageType,
      sponsors,

      // Kumpil (Confirmation) fields
      confirmandName,
      age,
      parishOrigin,
      baptizedAt,
      baptizedOn,
    } = req.body;

    /* ✅ Basic required field validation */
    if (
      !service_id ||
      !name ||
      !email ||
      !contactNumber ||
      !address ||
      !date ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields for appointment.",
      });
    }

    const userId = req.user?.id || null;
    await conn.beginTransaction();

    /* 1️⃣ Prevent duplicate booking (same slot and person) */
    const [dupes] = await conn.execute(
      `SELECT id FROM appointments 
       WHERE service_id=? AND date=? AND time=? 
         AND (email=? OR contactNumber=?)
         AND status IN ('pending','approved')`,
      [service_id, date, time, email, contactNumber]
    );
    if (dupes.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        error:
          "You already have a pending or approved appointment for this service and time.",
      });
    }

    /* 2️⃣ Prevent same email from booking same service (double booking prevention) */
    const [existingService] = await conn.execute(
      `SELECT a.id 
       FROM appointments a
       LEFT JOIN baptism_details b ON a.id = b.appointment_id
       WHERE a.service_id=? AND a.email=? 
         AND a.status IN ('pending','approved')`,
      [service_id, email]
    );
    if (existingService.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        error:
          "You already have an active appointment for this service with the same email.",
      });
    }

    /* 3️⃣ Check slot availability */
    const [bookedRows] = await conn.execute(
      `SELECT COUNT(*) as booked 
       FROM appointments 
       WHERE service_id=? AND date=? AND time=? 
         AND status IN ('pending','approved')`,
      [service_id, date, time]
    );
    const booked = bookedRows[0].booked;

    const [slotRules] = await conn.execute(
      `SELECT slots FROM rules
       WHERE service_id=? 
         AND (date=? OR (date IS NULL AND weekday=?))
         AND (type='single' AND time=? OR type IN ('allday','recurring')) 
       ORDER BY FIELD(type,'single','recurring','allday') DESC 
       LIMIT 1`,
      [service_id, date, new Date(date).getDay(), time]
    );

    const slotLimit = slotRules?.[0]?.slots || 0;
    if (slotLimit > 0 && booked >= slotLimit) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        error: "This schedule is already fully booked.",
      });
    }

    /* 4️⃣ Insert base appointment */
    const [apptResult] = await conn.execute(
      `INSERT INTO appointments 
        (service_id, user_id, name, email, contactNumber, address, date, time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        service_id ?? null,
        userId ?? null,
        name ?? null,
        email ?? null,
        contactNumber ?? null,
        address ?? null,
        date ?? null,
        time ?? null,
        notes ?? null,
      ]
    );
    const appointmentId = apptResult.insertId;

    /* 5️⃣ Get service info */
    const [[service]] = await conn.execute(
      "SELECT form_type, name FROM services WHERE id=?",
      [service_id]
    );

    /* 6️⃣ Handle special forms */
    if (service?.form_type === "baptism") {
      if (
        !childFullName ||
        !childDob ||
        !childBirthplace ||
        !fatherName ||
        !motherMaidenName ||
        !parentsMarriageType
      ) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: "Missing required baptism fields.",
        });
      }

      const [bapResult] = await conn.execute(
        `INSERT INTO baptism_details
          (appointment_id, childFullName, childDob, childBirthplace, fatherName, motherMaidenName, parentsMarriageType)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentId,
          childFullName,
          childDob,
          childBirthplace,
          fatherName,
          motherMaidenName,
          parentsMarriageType,
        ]
      );

      const baptismId = bapResult.insertId;
      if (Array.isArray(sponsors) && sponsors.length > 0) {
        for (const s of sponsors) {
          if (!s.name || !s.role) continue;
          await conn.execute(
            `INSERT INTO baptism_sponsors (baptism_id, role, name, address)
             VALUES (?, ?, ?, ?)`,
            [baptismId, s.role, s.name, s.address || ""]
          );
        }
      }
    } else if (service?.form_type === "confirmation") {
      if (
        !confirmandName ||
        !age ||
        !fatherName ||
        !motherMaidenName ||
        !parishOrigin ||
        !baptizedAt ||
        !baptizedOn
      ) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: "Missing required confirmation fields.",
        });
      }

      const [confResult] = await conn.execute(
        `INSERT INTO confirmation_details
          (appointment_id, confirmandName, edad, fatherName, motherMaidenName, parishOrigin, baptizedAt, baptizedOn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentId,
          confirmandName,
          age,
          fatherName,
          motherMaidenName,
          parishOrigin,
          baptizedAt,
          baptizedOn,
        ]
      );

      const confirmationId = confResult.insertId;
      if (Array.isArray(sponsors) && sponsors.length > 0) {
        for (const s of sponsors) {
          if (!s.name || !s.role) continue;
          await conn.execute(
            `INSERT INTO confirmation_sponsors (confirmation_id, role, name, address)
             VALUES (?, ?, ?, ?)`,
            [confirmationId, s.role, s.name, s.address || ""]
          );
        }
      }
    }

    await conn.commit();

    /* 7️⃣ Send email */
    try {
      await sendAppointmentCreatedEmail(email, {
        name,
        serviceName: service?.name || "Selected Service",
        date,
        time,
        appointmentId,
      });
    } catch (e) {
      console.error("sendAppointmentCreatedEmail failed:", e.message);
    }

    /* 8️⃣ Create notification for user */
    try {
      await createNotification({
        user_id: userId,
        title: "Appointment Created",
        message: `Your ${
          service?.name || "appointment"
        } for ${date} at ${time} has been successfully submitted and is now pending for approval.`,
        type: "appointment",
        reference_id: appointmentId,
      });
    } catch (e) {
      console.error("createNotification (user) failed:", e.message);
    }

    /* 9️⃣ Notify all admins */
    try {
      const [admins] = await conn.execute(
        "SELECT id FROM users WHERE role = 'admin'"
      );

      const messages = [
        `${name} just booked a ${service?.name || "service"} appointment for ${date} at ${time}.`,
        `A new ${service?.name || "appointment"} was created by ${name} — scheduled on ${date} at ${time}.`,
        `${name} has submitted a ${service?.name || "service"} request for ${date}, ${time}.`,
        `New booking alert: ${service?.name || "Appointment"} by ${name} on ${date} at ${time}.`,
      ];
      const adminMessage = messages[Math.floor(Math.random() * messages.length)];

      for (const admin of admins) {
        await createNotification({
          user_id: admin.id,
          title: "New Appointment Booking",
          message: adminMessage,
          type: "appointment",
          reference_id: appointmentId,
        });
      }
    } catch (e) {
      console.error("createNotification (admin) failed:", e.message);
    }

    return res.json({
      success: true,
      message: "Appointment created successfully",
      appointmentId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ createPublicAppointment error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
};


/* ==================================================
   GET /api/public/appointments/my
   → Get all appointments for the logged-in user
================================================== */
export async function getMyAppointments(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const [rows] = await pool.execute(
      `SELECT a.*, s.name AS serviceName, s.form_type
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      appointments: rows,
    });
  } catch (err) {
    console.error("❌ getMyAppointments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/* ==================================================
   GET /api/public/appointments/:id
   → Get details of a specific appointment (public view)
================================================== */
export async function getPublicAppointment(req, res) {
  const { id } = req.params;
  const userId = req.user?.id; // ✅ token payload
  try {
    // 1️⃣ Fetch appointment + service info
    const [[appt]] = await pool.execute(
      `SELECT a.*, s.name AS serviceName, s.form_type
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (!appt) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // 2️⃣ Ownership check — user can only view their own appointment
    // Admins can view everything (optional)
    if (appt.user_id && appt.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied: You can only view your own appointments.",
      });
    }

    // 3️⃣ Fetch form-specific details if needed
    let details = null;
    let sponsors = [];

    if (appt.form_type === "baptism") {
      [[details]] = await pool.execute(
        `SELECT * FROM baptism_details WHERE appointment_id=?`,
        [id]
      );
      const [sponsorRows] = await pool.execute(
        `SELECT * FROM baptism_sponsors WHERE baptism_id=?`,
        [details?.id || 0]
      );
      sponsors = sponsorRows;
    } else if (appt.form_type === "confirmation") {
      [[details]] = await pool.execute(
        `SELECT * FROM confirmation_details WHERE appointment_id=?`,
        [id]
      );
      const [sponsorRows] = await pool.execute(
        `SELECT * FROM confirmation_sponsors WHERE confirmation_id=?`,
        [details?.id || 0]
      );
      sponsors = sponsorRows;
    }

    return res.json({
      success: true,
      appointment: appt,
      details,
      sponsors,
    });
  } catch (err) {
    console.error("❌ getPublicAppointment error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
