import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

/* ===========================
   CREATE MYSQL POOL
=========================== */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
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

    console.log("✅ Connected to MySQL — initializing schema...");
    await ensureSchema(conn);
    await seedAdmin(conn);

    console.log("✅ Database schema ensured & seed complete");
  } catch (err) {
    console.error("❌ Database connection or schema init failed:", err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

// /* ===========================
//    RESET DATABASE (except users)
// =========================== */
// export const resetDatabase = async () => {
//   const conn = await pool.getConnection();
//   try {
//     console.log("⚠️ Resetting database tables (except users)...");
//     await conn.query("SET FOREIGN_KEY_CHECKS = 0");

//     const tables = [
//       "appointment_requirements",
//       "baptism_sponsors",
//       "baptism_details",
//       "confirmation_sponsors",
//       "confirmation_details",
//       "notifications",
//       "announcements",
//       "advisories",
//       "events",
//       "document_requests",
//       "rules",
//       "church_hours",
//       "appointments",
//       "requirements",
//       "services",
//       "change_email_requests",
//       "password_resets",
//       "email_verification_tokens"
//       // 👆 no "users" here
//     ];

//     for (const table of tables) {
//       console.log(`🧽 Truncating ${table}...`);
//       await conn.query(`TRUNCATE TABLE ${table}`);
//     }

//     await conn.query("SET FOREIGN_KEY_CHECKS = 1");
//     console.log("✅ Reset complete. Users preserved.");
//   } catch (err) {
//     console.error("❌ Failed to reset database:", err.message);
//     throw err;
//   } finally {
//     conn.release();
//   }
// };

/* ===========================
   SCHEMA CREATION
=========================== */
async function ensureSchema(conn) {
  console.log("🛠️ Ensuring database schema...");

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
    cutoff_days INT DEFAULT 0, -- ⬅️ Added for dynamic booking cutoff
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
      was_rescheduled BOOLEAN DEFAULT FALSE,          -- ✅ NEW COLUMN
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL DEFAULT NULL,
      completed_at TIMESTAMP NULL DEFAULT NULL,
      cancelled_at TIMESTAMP NULL DEFAULT NULL,
      requirements_completed_at DATETIME NULL,
      CONSTRAINT fk_appt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      INDEX idx_service (service_id, date, time, status)
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS appointment_requests  (
      id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    type ENUM('reschedule','cancel') NOT NULL,
    requested_date DATE NULL,
    requested_time TIME NULL,
    notes TEXT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_appt_type_status (appointment_id, type, status)

    )
  `);

  // ---- Appointment requirements
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

  // ---- Confirmation details
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

  // ---- Confirmation sponsors
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

  // ---- Events
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

  // ---- Advisories
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS advisories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('announcement','reminder') DEFAULT 'announcement',
      status ENUM('active','inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ---- Announcements
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      author VARCHAR(100) NOT NULL,
      text TEXT NOT NULL,
      link VARCHAR(255),
      date DATE NOT NULL,
      status ENUM('active','inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ---- Notifications
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

  // ---- Document requests

  await conn.execute(`DROP TABLE IF EXISTS document_requests;`);

  await conn.execute(`
  CREATE TABLE document_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    document_types JSON NOT NULL,
    purpose TEXT NOT NULL,
    copies INT DEFAULT 1 CHECK (copies >= 1 AND copies <= 10),
    additional_info TEXT NULL,
    status ENUM('pending','processing','completed','rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_doc_user (user_id),
    INDEX idx_doc_status (status)
  )
`);

  console.log("✅ Schema ensured successfully.");
}

/* ===========================
   SEED ADMIN + BASIC SERVICES
=========================== */
async function seedAdmin(conn) {
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

  const [baptism] = await conn.execute("SELECT id FROM services WHERE name=?", [
    "Baptism",
  ]);
  if (baptism.length === 0) {
    await conn.execute(
      "INSERT INTO services (name, description, form_type) VALUES (?, ?, ?)",
      ["Baptism", "Holy Baptism Service", "baptism"]
    );
    console.log("✅ Baptism service seeded");
  }

  const [confirmation] = await conn.execute(
    "SELECT id FROM services WHERE name=?",
    ["Kumpil"]
  );
  if (confirmation.length === 0) {
    await conn.execute(
      "INSERT INTO services (name, description, form_type) VALUES (?, ?, ?)",
      ["Kumpil", "Sakrament ng Kumpil (Confirmation Rite)", "confirmation"]
    );
    console.log("✅ Kumpil (Confirmation) service seeded");
  }
}
