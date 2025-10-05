import pool from "../../config/db.js";

/* ==================================================
   GET requirements for an appointment
================================================== */
export const getAppointmentRequirements = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get appointment + service_id
    const [[appt]] = await pool.query(
      `SELECT id, service_id, status, notes 
       FROM appointments 
       WHERE id=? LIMIT 1`,
      [id]
    );
    if (!appt) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // 2. Fetch requirements + completion progress
    const [reqs] = await pool.query(
      `SELECT r.id, r.name, r.is_mandatory,
              IFNULL(ar.completed, 0) as completed
       FROM requirements r
       LEFT JOIN appointment_requirements ar
         ON r.id = ar.requirement_id AND ar.appointment_id = ?
       WHERE r.service_id = ?
       ORDER BY r.id ASC`,
      [id, appt.service_id]
    );

    const total = reqs.length;
    const done = reqs.filter((r) => r.completed).length;

    res.json({
      success: true,
      requirements: reqs,
      notes: appt.notes || "",
      progress: { done, total },
    });
  } catch (err) {
    console.error("❌ getAppointmentRequirements error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch requirements" });
  }
};

/* ==================================================
   PATCH appointment requirements (progress only)
================================================== */
export const updateAppointmentRequirements = async (req, res) => {
  const { id } = req.params;
  const { requirements = [], notes = "" } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const r of requirements) {
      await conn.query(
        `INSERT INTO appointment_requirements (appointment_id, requirement_id, completed)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE completed = VALUES(completed)`,
        [id, r.id, r.completed ? 1 : 0]
      );
    }

    await conn.query(`UPDATE appointments SET notes=? WHERE id=?`, [notes, id]);

    await conn.commit();
    res.json({ success: true, message: "Progress saved" });
  } catch (err) {
    await conn.rollback();
    console.error("❌ updateAppointmentRequirements error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save progress" });
  } finally {
    conn.release();
  }
};

/* ==================================================
   PATCH mark appointment as completed
================================================== */
export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if all requirements are done
    const [remaining] = await pool.query(
      `SELECT COUNT(*) as notDone
       FROM requirements r
       LEFT JOIN appointment_requirements ar
         ON r.id = ar.requirement_id AND ar.appointment_id=?
       WHERE r.service_id = (SELECT service_id FROM appointments WHERE id=?)
         AND (ar.completed IS NULL OR ar.completed=0)`,
      [id, id]
    );

    if (remaining[0].notDone > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Not all requirements completed" });
    }

    await pool.query(`UPDATE appointments SET status='completed' WHERE id=?`, [
      id,
    ]);

    res.json({ success: true, message: "Appointment marked as completed" });
  } catch (err) {
    console.error("❌ completeAppointment error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to complete appointment" });
  }
};

/* ==================================================
   CREATE requirement (inline from ProcessModal)
================================================== */
export const createRequirement = async (req, res) => {
  try {
    const { service_id, name, is_mandatory = true } = req.body;

    if (!service_id || !name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Service ID and name are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO requirements (service_id, name, is_mandatory) VALUES (?, ?, ?)`,
      [service_id, name.trim(), is_mandatory ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      requirement: {
        id: result.insertId,
        service_id,
        name: name.trim(),
        is_mandatory,
      },
    });
  } catch (err) {
    console.error("❌ createRequirement error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create requirement" });
  }
};

/* ==================================================
   UPDATE requirement (rename/edit)
================================================== */
export const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_mandatory } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Requirement name is required" });
    }

    const [result] = await pool.query(
      `UPDATE requirements SET name=?, is_mandatory=? WHERE id=?`,
      [name.trim(), is_mandatory !== false, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Requirement not found" });
    }

    res.json({
      success: true,
      message: "Requirement updated",
      requirement: { id, name, is_mandatory },
    });
  } catch (err) {
    console.error("❌ updateRequirement error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update requirement" });
  }
};

/* ==================================================
   DELETE requirement
================================================== */
export const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM requirements WHERE id=?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Requirement not found" });
    }

    res.json({ success: true, message: "Requirement deleted", id });
  } catch (err) {
    console.error("❌ deleteRequirement error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete requirement" });
  }
};
