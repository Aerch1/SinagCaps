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

export default pool;

/* ----------------------------------------
   DB CONNECTION + INIT
---------------------------------------- */
export const connectDB = async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    await ensureSchema(conn);
    if (process.env.NODE_ENV === "development") {
      await seedDemoData(conn); // ✅ now visible (defined below at module scope)
    }
  } catch (e) {
    console.error("❌ Database connection failed:", e.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

/* ----------------------------------------
   SCHEMA CREATION
---------------------------------------- */
async function ensureSchema(conn) {
  // Users
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('user','admin') DEFAULT 'user',
      lastLogin TIMESTAMP NULL,
      isVerified BOOLEAN DEFAULT FALSE,

      phone VARCHAR(32) NULL,
      gender VARCHAR(32) NULL,
      dob DATE NULL,
      location VARCHAR(255) NULL,
      avatarUrl VARCHAR(500) NULL,

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Email verification tokens
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

  // Password resets
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

  // Change email requests
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

  // Availability templates
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS availability_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service VARCHAR(50) NOT NULL,
      weekday TINYINT NOT NULL,
      time_12h VARCHAR(20) NOT NULL,
      default_slots INT NOT NULL DEFAULT 0,
      UNIQUE KEY uniq_template (service, weekday, time_12h)
    )
  `);

  // Weekly blocks
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS availability_weekly_blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service VARCHAR(50) NOT NULL,
      weekday TINYINT NOT NULL,
      UNIQUE KEY uniq_block (service, weekday)
    )
  `);

  // Overrides
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS availability_overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      status ENUM('available','unavailable','blocked') DEFAULT NULL,
      times JSON NULL,
      time_capacity JSON NULL,
      UNIQUE KEY uniq_override (service, date)
    )
  `);

  // Appointments
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      contactNumber VARCHAR(32) NULL,
      serviceType VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(20) NOT NULL,
      party_size INT NOT NULL DEFAULT 1,
      status ENUM('pending','approved','completed','cancelled','failed') NOT NULL DEFAULT 'pending',

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      CONSTRAINT fk_appt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_service (serviceType, date, time, status),
      INDEX idx_status (status),
      INDEX idx_email (email)
    )
  `);

  // Ensure contactNumber exists if table pre-existed
  const [cols] = await conn.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'appointments'
      AND COLUMN_NAME = 'contactNumber'
  `);
  if (!cols.length) {
    await conn.execute(`
      ALTER TABLE appointments
      ADD COLUMN contactNumber VARCHAR(32) NULL AFTER email,
      ADD INDEX idx_contactNumber (contactNumber)
    `);
  }
}

/* ----------------------------------------
   DEMO DATA SEEDING  (MOVED OUTSIDE ensureSchema)
---------------------------------------- */
async function seedDemoData(conn) {
  // Seed default admin
  const [users] = await conn.execute("SELECT id FROM users WHERE email = ?", [
    "admin@example.com",
  ]);
  if (users.length === 0) {
    const bcryptjs = await import("bcryptjs");
    const hashed = await bcryptjs.default.hash("admin123", 12);
    await conn.execute(
      "INSERT INTO users (name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)",
      ["Admin User", "admin@example.com", hashed, "admin", true]
    );
  }

  // Reseed appointments every time in dev (clean state)
  await conn.execute("TRUNCATE TABLE appointments");

  await conn.execute(`
    INSERT INTO appointments (name, email, contactNumber, serviceType, date, time, party_size, status)
    VALUES
      ('Shawn Robertson', 'shawn@example.com',   '0917-123-4567', 'Baptism',          '2025-09-20', '09:00 AM', 3,  'approved'),
      ('Eduardo Cooper',  'eduardo@example.com', '0918-222-3333', 'Wedding',          '2025-09-22', '02:00 PM', 50, 'pending'),
      ('Marjorie Miles',  'marjorie@example.com','0920-888-0000', 'Funeral',          '2025-09-25', '10:30 AM', 10, 'completed'),
      ('Latif Lee',       'latif@example.com',   '0999-111-2222', 'Counseling',       '2025-09-26', '11:00 AM', 2,  'pending'),
      ('Alice Walker',    'alice@example.com',   '0917-777-4444', 'Document Request', '2025-09-28', '03:00 PM', 1,  'cancelled')
  `);
}
