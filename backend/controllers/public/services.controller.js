import pool from "../../config/db.js";

/* ---------------- PUBLIC VIEW: Active Services + Requirements ---------------- */
export const getPublicServices = async (req, res) => {
  try {
    // ✅ Fetch only active services
    const [rows] = await pool.query(
      `SELECT id, name, description, form_type
       FROM services 
       WHERE active = true 
       ORDER BY created_at ASC`
    );

    // ✅ Fetch all related requirements
    const [reqs] = await pool.query(
      `SELECT id, service_id, name, is_mandatory
       FROM requirements
       ORDER BY created_at ASC`
    );

    // ✅ Group requirements by service
    const services = rows.map((s) => ({
      ...s,
      requirements: reqs.filter((r) => r.service_id === s.id),
    }));

    res.json({ success: true, services });
  } catch (err) {
    console.error("❌ getPublicServices error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};
