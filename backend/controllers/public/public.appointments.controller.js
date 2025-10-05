import pool from "../../config/db.js";
import { sendAppointmentCreatedEmail } from "../../utils/appointmentEmails.js"; // ✅ keep email sending

/* ==================================================
   CREATE Public Appointment
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
      // baptism-specific
      childFullName,
      childDob,
      childBirthplace,
      fatherName,
      motherMaidenName,
      parentsMarriageType,
      sponsors,
    } = req.body;

    if (!service_id || !name || !date || !time) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    await conn.beginTransaction();

    // 1. Check for duplicate booking (❌ removed 'in_progress')
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

    // 2. Check slot availability (❌ removed 'in_progress')
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

    // 3. Insert appointment
    const [apptResult] = await conn.execute(
      `INSERT INTO appointments 
        (service_id, name, email, contactNumber, address, date, time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [service_id, name, email, contactNumber, address, date, time, notes]
    );
    const appointmentId = apptResult.insertId;

    // 4. Extra tables (baptism, etc.)
    const [[service]] = await conn.execute(
      "SELECT form_type, name FROM services WHERE id=?",
      [service_id]
    );

    if (service?.form_type === "baptism") {
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
    }

    await conn.commit();

    // ✅ Send confirmation email (non-blocking)
    try {
      await sendAppointmentCreatedEmail(email, {
        name,
        serviceName: service?.name || "Selected Service",
        date,
        time,
        appointmentId, // keep id in email
      });
    } catch (e) {
      console.error("sendAppointmentCreatedEmail failed:", e.message);
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
}

/* ==================================================
   GET Public Appointment Details
================================================== */
export async function getPublicAppointment(req, res) {
  const { id } = req.params;
  try {
    const [[appt]] = await pool.execute(
      `SELECT a.*, s.name as serviceName, s.form_type
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.id=?`,
      [id]
    );

    if (!appt) {
      return res
        .status(404)
        .json({ success: false, error: "Appointment not found" });
    }

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
