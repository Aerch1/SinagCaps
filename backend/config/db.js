// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

/* ===========================
   POOL
=========================== */
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

/* ===========================
   CONNECT + INIT
=========================== */
export const connectDB = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await ensureSchema(conn);

    if (process.env.NODE_ENV === "development") {
      await seedAdmin(conn);
      console.log("✅ Database schema ensured & admin seeded");
    } else {
      console.log("✅ Database schema ensured");
    }
  } catch (e) {
    console.error("❌ Database connection failed:", e.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

/* ===========================
   SCHEMA
=========================== */
async function ensureSchema(conn) {
  const isDev = process.env.NODE_ENV === "development";
  const doReset =
    isDev && String(process.env.DB_RESET).toLowerCase() === "true";

  if (!doReset) {
    console.warn("⚠️  DB_RESET=true → Dropping existing tables (dev only)...");
    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
    await conn.execute("DROP TABLE IF EXISTS baptism_sponsors");
    await conn.execute("DROP TABLE IF EXISTS baptism_details");
    await conn.execute("DROP TABLE IF EXISTS appointment_requirements");
    await conn.execute("DROP TABLE IF EXISTS appointments");
    await conn.execute("DROP TABLE IF EXISTS rules");
    await conn.execute("DROP TABLE IF EXISTS church_hours");
    await conn.execute("DROP TABLE IF EXISTS requirements");
    await conn.execute("DROP TABLE IF EXISTS services");
    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
  }

  // ---- Users
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

  // ---- Email verification tokens
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

  // ---- Password resets
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

  // ---- Change email requests
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

  // ---- Services
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT TRUE,
      form_type ENUM('default','baptism','wedding','confirmation','confession','anointing')
        DEFAULT 'default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ---- Requirements
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_mandatory BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    )
  `);

  // ---- Church hours
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS church_hours (
      id INT AUTO_INCREMENT PRIMARY KEY,
      day_of_week TINYINT NOT NULL,
      open_time TIME NOT NULL,
      close_time TIME NOT NULL,
      is_closed BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE KEY uniq_day (day_of_week)
    )
  `);

  // ---- Rules
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      weekday TINYINT NULL,
      date DATE NULL,
      status ENUM('available','blocked') DEFAULT 'available',
      type ENUM('single','recurring','allday') NOT NULL DEFAULT 'single',
      time TIME NULL,
      start TIME NULL,
      end TIME NULL,
      interval_mins INT NULL,
      slots INT NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_rule (service_id, weekday, date, type, time, start, end),
      INDEX idx_rule_lookup (service_id, weekday, date)
    )
  `);

  // ---- Appointments
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      service_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      contactNumber VARCHAR(32),
      address VARCHAR(500) NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      party_size INT NOT NULL DEFAULT 1,
      status ENUM('pending','approved','in_progress','completed','cancelled','failed') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_appt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      INDEX idx_service (service_id, date, time, status)
    )
  `);

  // ---- Appointment requirements
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS appointment_requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      requirement_id INT NOT NULL,
      status ENUM('pending','submitted','approved','rejected') DEFAULT 'pending',
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_appt_req (appointment_id, requirement_id)
    )
  `);

  // ---- Baptism details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS baptism_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      childFullName VARCHAR(255) NOT NULL,
      childDob DATE NOT NULL,
      childBirthplace VARCHAR(255) NOT NULL,
      fatherName VARCHAR(255) NOT NULL,
      motherMaidenName VARCHAR(255) NOT NULL,
      parentsMarriageType ENUM('church','civil','unmarried') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_baptism_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  // ---- Baptism sponsors
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS baptism_sponsors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      baptism_id INT NOT NULL,
      role ENUM('Ninong','Ninang') NOT NULL,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_baptism_sponsor FOREIGN KEY (baptism_id) REFERENCES baptism_details(id) ON DELETE CASCADE
    )
  `);
}

/* ===========================
   SEED ADMIN + PUBLIC DATA
=========================== */
async function seedAdmin(conn) {
 
  
  
  // --- seed admin
  const [users] = await conn.execute("SELECT id FROM users WHERE email=?", [
    "admin@example.com",
  ]);
  if (users.length === 0) {
    const bcryptjs = await import("bcryptjs");
    const hashed = await bcryptjs.default.hash("admin123", 12);
    await conn.execute(
      "INSERT INTO users (name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)",
      ["Admin User", "admin@example.com", hashed, "admin", true]
    );
    console.log("✅ Default admin created: admin@example.com / admin123");
  }

  // --- seed one baptism service
  const [services] = await conn.execute(
    "SELECT id FROM services WHERE name=?",
    ["Baptism"]
  );
  let baptismServiceId;
  if (services.length === 0) {
    const [result] = await conn.execute(
      "INSERT INTO services (name, description, form_type) VALUES (?, ?, ?)",
      ["Baptism", "Holy Baptism Service", "baptism"]
    );
    baptismServiceId = result.insertId;
    console.log("✅ Baptism service seeded");
  } else {
    baptismServiceId = services[0].id;
  }

  // --- seed one appointment if none
  const [appts] = await conn.execute(
    "SELECT id FROM appointments WHERE service_id=?",
    [baptismServiceId]
  );
  if (appts.length === 0) {
    const [appt] = await conn.execute(
      `INSERT INTO appointments 
        (service_id, name, email, contactNumber, address, date, time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        baptismServiceId,
        "Parent Juan Dela Cruz",
        "parent@example.com",
        "09171234567",
        "123 Barangay St., Lipa City",
        "2025-10-15",
        "09:00:00",
        "Seeded test appointment",
      ]
    );
    const apptId = appt.insertId;

    const [bap] = await conn.execute(
      `INSERT INTO baptism_details
        (appointment_id, childFullName, childDob, childBirthplace, fatherName, motherMaidenName, parentsMarriageType)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        apptId,
        "Baby Maria Dela Cruz",
        "2024-08-12",
        "Lipa City Hospital",
        "Jose Dela Cruz",
        "Maria Santos",
        "church",
      ]
    );
    const baptismId = bap.insertId;

    await conn.execute(
      `INSERT INTO baptism_sponsors (baptism_id, role, name, address) VALUES (?, ?, ?, ?)`,
      [baptismId, "Ninong", "Pedro Santos", "Lipa City"]
    );
    await conn.execute(
      `INSERT INTO baptism_sponsors (baptism_id, role, name, address) VALUES (?, ?, ?, ?)`,
      [baptismId, "Ninang", "Maria Lopez", "Batangas City"]
    );

    console.log(
      "✅ Seeded one baptism appointment + baptism_details + sponsors"
    );
  }
}
