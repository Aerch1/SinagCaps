import pool from "../../config/db.js";

/* ==================================================
   GET requirements for an appointment
================================================== */
export const getAppointmentRequirements = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Get appointment + service_id
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

    // 2️⃣ Fetch requirements + completion progress
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
   PATCH appointment requirements
   (progress or mark_completed flag)
================================================== */
export const updateAppointmentRequirements = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { requirements = [], notes = "", mark_completed = false } = req.body;

    await conn.beginTransaction();

    // 1) Ensure appt exists
    const [[appointment]] = await conn.query(
      `SELECT id, service_id FROM appointments WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!appointment) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    }

    // 2) Upsert requirement completions
    if (requirements.length) {
      for (const r of requirements) {
        if (typeof r.id === "undefined") continue;
        await conn.query(
          `INSERT INTO appointment_requirements (appointment_id, requirement_id, completed)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE completed = VALUES(completed)`,
          [id, r.id, r.completed ? 1 : 0]
        );
      }
    }

    // 3) Update notes
    await conn.query(`UPDATE appointments SET notes = ? WHERE id = ?`, [
      notes || "",
      id,
    ]);

    // 4) Optional: “mark completed” = validate mandatory reqs only
    if (mark_completed) {
      const [check] = await conn.query(
        `SELECT r.id, r.is_mandatory, ar.completed
         FROM requirements r
         LEFT JOIN appointment_requirements ar
           ON ar.requirement_id = r.id AND ar.appointment_id = ?
         WHERE r.service_id = ?`,
        [id, appointment.service_id]
      );

      const total = check.length;
      const done = check.filter((r) => !!r.completed).length;
      const mandatoryIncomplete = check.some(
        (r) => r.is_mandatory && !r.completed
      );

      if (mandatoryIncomplete) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Some mandatory requirements are not yet completed.",
          progress: { done, total },
        });
      }

      // ❇️ Try to stamp a timestamp if the column exists; ignore if it doesn’t
      try {
        await conn.query(
          `UPDATE appointments SET requirements_completed_at = NOW() WHERE id = ?`,
          [id]
        );
      } catch (e) {
        // Ignore “unknown column” errors so older schemas still work
        if (e?.code !== "ER_BAD_FIELD_ERROR") throw e;
      }
    }

    await conn.commit();
    res.json({
      success: true,
      message: mark_completed
        ? "All requirements marked as completed successfully."
        : "Requirements progress saved successfully.",
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ updateAppointmentRequirements error:", err);
    res.status(500).json({
      success: false,
      message: err?.message || "Failed to update requirements.",
    });
  } finally {
    conn.release();
  }
};

/* ==================================================
   PATCH mark appointment as fully completed (status)
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
      return res.status(400).json({
        success: false,
        message: "Not all requirements are completed yet.",
      });
    }

    await pool.query(`UPDATE appointments SET status='completed' WHERE id=?`, [
      id,
    ]);

    res.json({ success: true, message: "Appointment marked as completed." });
  } catch (err) {
    console.error("❌ completeAppointment error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment.",
    });
  }
};

/* ==================================================
   CREATE requirement (inline from ProcessModal)
================================================== */
export const createRequirement = async (req, res) => {
  try {
    const { service_id, name, is_mandatory = true } = req.body;

    if (!service_id || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service ID and name are required.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO requirements (service_id, name, is_mandatory)
       VALUES (?, ?, ?)`,
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
    res.status(500).json({
      success: false,
      message: "Failed to create requirement.",
    });
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
      return res.status(400).json({
        success: false,
        message: "Requirement name is required.",
      });
    }

    const [result] = await pool.query(
      `UPDATE requirements SET name=?, is_mandatory=? WHERE id=?`,
      [name.trim(), is_mandatory !== false, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found.",
      });
    }

    res.json({
      success: true,
      message: "Requirement updated successfully.",
      requirement: { id, name, is_mandatory },
    });
  } catch (err) {
    console.error("❌ updateRequirement error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update requirement.",
    });
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
      return res.status(404).json({
        success: false,
        message: "Requirement not found.",
      });
    }

    res.json({
      success: true,
      message: "Requirement deleted successfully.",
      id,
    });
  } catch (err) {
    console.error("❌ deleteRequirement error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete requirement.",
    });
  }
};
