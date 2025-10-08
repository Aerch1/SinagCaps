// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

/* ===========================
   CREATE POOL (LOCAL or RAILWAY)
=========================== */
let pool;

if (process.env.DATABASE_URL) {
  // ✅ Use Railway internal connection (private network)
  pool = mysql.createPool(process.env.DATABASE_URL);
  console.log("🔗 Using Railway internal DATABASE_URL connection");
} else {
  // ✅ Fallback for local development
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "olpgvp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("💻 Using local MySQL connection");
}

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
    console.warn("⚠️  DB_RESET=true → Dropping all tables except 'users'...");
    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

    // 🔹 Drop only dependent / related tables — but keep `users`
    const tablesToDrop = [
      "confirmation_details",
      "confirmation_sponsors",
      "baptism_sponsors",
      "baptism_details",
      "document_requests",
      "appointment_requirements",
      "appointments",
      "rules",
      "church_hours",
      "requirements",
      "services",
      "email_verification_tokens",
      "password_resets",
      "change_email_requests",
      "events",
      "advisories",
      "announcements",
      "notifications",
    ];

    for (const tbl of tablesToDrop) {
      await conn.execute(`DROP TABLE IF EXISTS ${tbl}`);
    }

    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Reset complete — all tables dropped except 'users'.");
  } else {
    console.log("ℹ️ DB_RESET not set — skipping drop (keeping existing data).");
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
    status ENUM('pending','approved','completed','cancelled','rejected','archived') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_at TIMESTAMP NULL DEFAULT NULL,
    requirements_completed_at DATETIME NULL,   -- ✅ Add this here
    CONSTRAINT fk_appt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_service (service_id, date, time, status)
  )
`);

  // ---- Appointment requirements (cleaned up: removed status column)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS appointment_requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      requirement_id INT NOT NULL,
      completed TINYINT(1) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_appt_req (appointment_id, requirement_id)
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

  // ---- Confirmation (Kumpil) details
  await conn.execute(`
  CREATE TABLE IF NOT EXISTS confirmation_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    confirmandName VARCHAR(255) NOT NULL,
    edad INT NOT NULL,
    fatherName VARCHAR(255) NOT NULL,
    motherMaidenName VARCHAR(255) NOT NULL,
    parishOrigin VARCHAR(255) NOT NULL,
    baptizedAt VARCHAR(255) NOT NULL,
    baptizedOn DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_confirmation_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
  )
`);

  // ---- Confirmation (Kumpil) sponsors
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS confirmation_sponsors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      confirmation_id INT NOT NULL,
      role ENUM('Ninong','Ninang') NOT NULL,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_confirmation_sponsor FOREIGN KEY (confirmation_id) REFERENCES confirmation_details(id) ON DELETE CASCADE
    )
  `);

  // ---- Events & News
  await conn.execute(`
  CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status ENUM('Active','Inactive') DEFAULT 'Active',
    type ENUM('event','news') NOT NULL DEFAULT 'event',
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

  await conn.execute(`
  CREATE TABLE IF NOT EXISTS advisories  (
     id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('announcement', 'reminder') DEFAULT 'announcement',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

  await conn.execute(`
  CREATE TABLE IF NOT EXISTS announcements  (
    id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  link VARCHAR(255),
  date DATE NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

  await conn.execute(`
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('system','appointment','announcement','event','advisory','document') DEFAULT 'system',
  reference_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
`);

  await conn.execute(`
  CREATE TABLE IF NOT EXISTS document_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL UNIQUE,           -- e.g. "REQ-001"
    user_id INT NULL,                                   -- ✅ allow NULL for public requests
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    document_type ENUM(
      'baptism', 'confirmation', 'marriage',
      'first-communion', 'death', 'membership', 'other'
    ) NOT NULL,
    purpose TEXT NOT NULL,
    copies INT DEFAULT 1 CHECK (copies >= 1 AND copies <= 10),
    additional_info TEXT NULL,
    status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,    
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_doc_user (user_id),
    INDEX idx_doc_type (document_type),
    INDEX idx_doc_status (status)
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

  const [confirmationServices] = await conn.execute(
    "SELECT id FROM services WHERE name=?",
    ["Kumpil"]
  );
  if (confirmationServices.length === 0) {
    await conn.execute(
      "INSERT INTO services (name, description, form_type) VALUES (?, ?, ?)",
      ["Kumpil", "Sakrament ng Kumpil (Confirmation Rite)", "confirmation"]
    );
    console.log("✅ Kumpil (Confirmation) service seeded");
  }
}
