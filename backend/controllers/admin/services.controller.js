// src/controllers/admin/services.controller.js
import pool from "../../config/db.js";

/* ---------------- GET all services ---------------- */
export const getServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, active, created_at FROM services ORDER BY created_at DESC`
    );
    res.json({ success: true, services: rows });
  } catch (err) {
    console.error("❌ getServices error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch services" });
  }
};

/* ---------------- CREATE service ---------------- */
export const createService = async (req, res) => {
  try {
    const { name, active = true } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    const [existing] = await pool.query(
      `SELECT id FROM services WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [name.trim()]
    );
    if (existing.length) {
      return res
        .status(400)
        .json({ success: false, message: "Service already exists" });
    }

    const [result] = await pool.query(
      `INSERT INTO services (name, active) VALUES (?, ?)`,
      [name.trim(), !!active]
    );

    res.status(201).json({
      success: true,
      service: { id: result.insertId, name: name.trim(), active: !!active },
    });
  } catch (err) {
    console.error("❌ createService error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create service" });
  }
};

/* ---------------- UPDATE service ---------------- */
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    const [existing] = await pool.query(
      `SELECT id FROM services WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1`,
      [name.trim(), id]
    );
    if (existing.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Another service with this name already exists",
        });
    }

    const [result] = await pool.query(
      `UPDATE services SET name = ?, active = ? WHERE id = ?`,
      [name.trim(), !!active, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, message: "Service updated successfully" });
  } catch (err) {
    console.error("❌ updateService error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update service" });
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
    res
      .status(500)
      .json({ success: false, message: "Failed to delete service" });
  }
};
