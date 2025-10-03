import pool from "../../config/db.js";

export const getPublicServices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, form_type
       FROM services 
       WHERE active = true 
       ORDER BY created_at ASC`
    );

    const [reqs] = await pool.query(
      `SELECT r.id, r.service_id, r.name, r.is_mandatory
       FROM requirements r
       ORDER BY r.created_at ASC`
    );

    const services = rows.map((s) => ({
      ...s,
      requirements: reqs.filter((r) => r.service_id === s.id),
    }));

    res.json({ success: true, services });
  } catch (err) {
    console.error("❌ getPublicServices error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch services" });
  }
};
