// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "auth_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDB = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${process.env.DB_HOST}`);

    // --- 1) Core identity only ---
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('user','admin') DEFAULT 'user',
        lastLogin TIMESTAMP NULL,
        isVerified BOOLEAN DEFAULT FALSE,

        -- profile (kept minimal but useful)
        phone VARCHAR(32) NULL,
        gender VARCHAR(32) NULL,
        dob DATE NULL,
        location VARCHAR(255) NULL,
        avatarUrl VARCHAR(500) NULL,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // --- 2) Email verification one-to-many (signup / change email) ---
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token CHAR(6) NOT NULL,
        purpose ENUM('signup','change_email') NOT NULL DEFAULT 'signup',
        sent_to_email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX (user_id, consumed_at, expires_at),
        INDEX (token),
        INDEX (purpose)
      )
    `);

    // --- 3) Password reset one-to-many ---
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX (user_id, expires_at, consumed_at)
      )
    `);

    // --- 4) Change email request (code per target email) ---
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS change_email_requests (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        new_email VARCHAR(255) NOT NULL,
        code CHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_user_newemail (user_id, new_email),
        INDEX (user_id, expires_at, consumed_at),
        INDEX (code)
      )
    `);

    console.log("✅ Tables ensured");

    // seed admin in dev (unchanged)
    if (process.env.NODE_ENV === "development") {
      const [rows] = await conn.execute(
        "SELECT id FROM users WHERE email = ?",
        ["admin@example.com"]
      );
      if (rows.length === 0) {
        const bcryptjs = await import("bcryptjs");
        const hashed = await bcryptjs.default.hash("admin123", 12);
        await conn.execute(
          "INSERT INTO users (name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)",
          ["Admin User", "admin@example.com", hashed, "admin", true]
        );
        console.log("✅ Default admin: admin@example.com / admin123");
      }
    }

    console.log("✅ Database initialization completed");
  } catch (e) {
    console.error("❌ Database connection failed:", e.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

export default pool;
