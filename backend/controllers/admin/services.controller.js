import pool from "../../config/db.js";

/* ---------------- GET all services ---------------- */
export const getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, active, form_type, cutoff_days, created_at 
       FROM services 
       ORDER BY created_at DESC`
    );

    // Fetch requirements for each service
    const [reqs] = await pool.query(
      `SELECT r.id, r.service_id, r.name, r.is_mandatory
       FROM requirements r
       ORDER BY r.created_at ASC`
    );

    // Group requirements under their service
    const services = rows.map((s) => ({
      ...s,
      requirements: reqs.filter((r) => r.service_id === s.id),
    }));

    res.json({ success: true, services });
  } catch (err) {
    console.error("❌ getServices error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch services",
    });
  }
};

/* ---------------- CREATE service ---------------- */
export const createService = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      name,
      active = true,
      requirements = [],
      formType = "default",
      cutoff_days = 0, // ✅ Added for cutoff restriction
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    await conn.beginTransaction();

    // Check duplicate service
    const [existing] = await conn.query(
      `SELECT id FROM services WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [name.trim()]
    );
    if (existing.length) {
      await conn.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Service already exists" });
    }

    // ✅ Insert with cutoff_days
    const [result] = await conn.query(
      `INSERT INTO services (name, active, form_type, cutoff_days) VALUES (?, ?, ?, ?)`,
      [name.trim(), !!active, formType, cutoff_days ?? 0]
    );
    const serviceId = result.insertId;

    // Insert requirements if provided
    if (requirements.length) {
      const values = requirements.map((r) => [
        serviceId,
        r.name.trim(),
        r.description || null,
        r.is_mandatory !== false, // default true
      ]);
      await conn.query(
        `INSERT INTO requirements (service_id, name, description, is_mandatory)
         VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      service: {
        id: serviceId,
        name: name.trim(),
        active: !!active,
        formType,
        cutoff_days: cutoff_days ?? 0,
        requirements,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ createService error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Failed to create service",
    });
  } finally {
    conn.release();
  }
};

/* ---------------- UPDATE service ---------------- */
export const updateService = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      name,
      active,
      requirements = [],
      formType = "default",
      cutoff_days = 0, // ✅ Added
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    await conn.beginTransaction();

    // Ensure name unique (exclude current id)
    const [existing] = await conn.query(
      `SELECT id FROM services WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1`,
      [name.trim(), id]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Another service with this name already exists",
      });
    }

    // ✅ Update cutoff_days too
    const [updateResult] = await conn.query(
      `UPDATE services 
       SET name = ?, active = ?, form_type = ?, cutoff_days = ? 
       WHERE id = ?`,
      [name.trim(), !!active, formType, cutoff_days ?? 0, id]
    );

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Reset + insert requirements
    await conn.query(`DELETE FROM requirements WHERE service_id = ?`, [id]);

    if (requirements.length) {
      const values = requirements.map((r) => [
        id,
        r.name.trim(),
        r.description || null,
        r.is_mandatory !== false,
      ]);
      await conn.query(
        `INSERT INTO requirements (service_id, name, description, is_mandatory)
         VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    res.json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (err) {
    await conn.rollback();
    console.error("❌ updateService error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Failed to update service",
    });
  } finally {
    conn.release();
  }
};

/* ---------------- DELETE service ---------------- */
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM services WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    console.error("❌ deleteService error:", err);

    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete service because it is still in use.",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete service",
    });
  }
};

/* ---------------- ADD requirement to existing service ---------------- */
export const addServiceRequirement = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { serviceId } = req.params;
    const { name, description = null, is_mandatory = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Requirement name is required",
      });
    }

    // Ensure service exists
    const [[service]] = await conn.query(
      "SELECT id FROM services WHERE id = ? LIMIT 1",
      [serviceId]
    );
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const trimmedName = name.trim();

    // ✅ Prevent duplicate requirement names
    const [existing] = await conn.query(
      `SELECT id FROM requirements 
       WHERE service_id = ? AND LOWER(name) = LOWER(?) 
       LIMIT 1`,
      [serviceId, trimmedName]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This requirement already exists for the selected service.",
      });
    }

    // ✅ Insert new requirement
    const [result] = await conn.query(
      `INSERT INTO requirements (service_id, name, description, is_mandatory)
       VALUES (?, ?, ?, ?)`,
      [serviceId, trimmedName, description, !!is_mandatory]
    );

    res.status(201).json({
      success: true,
      message: "Requirement added successfully",
      requirement: {
        id: result.insertId,
        service_id: Number(serviceId),
        name: trimmedName,
        description,
        is_mandatory: !!is_mandatory,
        created_at: new Date(),
      },
    });
  } catch (err) {
    console.error("❌ addServiceRequirement error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add requirement",
    });
  } finally {
    conn.release();
  }
};
