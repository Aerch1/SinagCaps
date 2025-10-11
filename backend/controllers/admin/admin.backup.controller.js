// src/controllers/admin.backup.controller.js
import pool from "../config/db.js";
import fs from "fs";
import path from "path";

/* 🧾 List of tables to backup — adjust if needed */
const TABLES = [
  "users",
  "services",
  "requirements",
  "appointments",
  "appointment_requirements",
  "church_hours",
  "rules",
  "baptism_details",
  "baptism_sponsors",
  "confirmation_details",
  "confirmation_sponsors",
  "events",
  "announcements",
  "advisories",
  "notifications",
  "document_requests",
];

/* ======================================
   BACKUP DATABASE — EXPORT TO JSON
====================================== */
export const exportBackup = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const backup = {};

    for (const table of TABLES) {
      const [rows] = await conn.query(`SELECT * FROM ${table}`);
      backup[table] = rows;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join("/tmp", filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf-8");

    res.download(filepath, filename, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(filepath);
    });
  } catch (err) {
    console.error("❌ Backup failed:", err);
    res.status(500).json({ success: false, message: "Backup failed" });
  } finally {
    conn.release();
  }
};

/* ======================================
   IMPORT DATABASE — RESTORE FROM BACKUP
====================================== */
export const importBackup = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const data = JSON.parse(fs.readFileSync(req.file.path, "utf-8"));

    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of TABLES) {
      const rows = data[table] || [];
      if (rows.length === 0) continue;

      // Build dynamic insert
      const keys = Object.keys(rows[0]);
      const placeholders = `(${keys.map(() => "?").join(",")})`;
      const insertQuery = `INSERT INTO ${table} (${keys.join(
        ","
      )}) VALUES ${rows.map(() => placeholders).join(",")}`;

      const values = rows.flatMap(Object.values);
      await conn.query(`DELETE FROM ${table}`); // optional: clean before insert
      await conn.query(insertQuery, values);
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();

    res.json({ success: true, message: "Backup imported successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Import failed:", err);
    res.status(500).json({ success: false, message: "Import failed" });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
    conn.release();
  }
};
