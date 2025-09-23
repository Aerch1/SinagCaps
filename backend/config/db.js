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
      await seedDemoData(conn);
      console.log("✅ Database schema ensured & demo data seeded");
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
  const isDev = process.env.NODE_ENV === "development";

  // 🔹 Drop detail tables in dev so schema updates apply cleanly
  if (isDev) {
    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
    await conn.execute("DROP TABLE IF EXISTS baptism_details");
    await conn.execute("DROP TABLE IF EXISTS wedding_details");
    await conn.execute("DROP TABLE IF EXISTS funeral_details");
    await conn.execute("DROP TABLE IF EXISTS counseling_details");
    await conn.execute("DROP TABLE IF EXISTS confirmation_details");
    await conn.execute("DROP TABLE IF EXISTS document_request_details");
    await conn.execute("DROP TABLE IF EXISTS appointments");
    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
  }

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

  // Appointments
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      contactNumber VARCHAR(32),
      serviceType ENUM('Baptism','Wedding','Funeral','Counseling','Confirmation','Document Request') NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(20) NOT NULL,
      party_size INT NOT NULL DEFAULT 1,
      status ENUM('pending','approved','in_progress','completed','cancelled','failed') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_service (serviceType, date, time, status)
    )
  `);

  // Baptism details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS baptism_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      childFullName VARCHAR(255),
      childDob DATE,
      childBirthplace VARCHAR(255),
      fatherName VARCHAR(255),
      motherMaidenName VARCHAR(255),
      parentsMarriageType ENUM('church','civil','unmarried'),
      sponsors JSON,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  // Wedding details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS wedding_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      marriageLicense VARCHAR(255),
      baptismCertificates JSON,
      seminarAttendance BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  // Funeral details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS funeral_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      deathCertificate VARCHAR(255),
      parishClearance VARCHAR(255),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  // Counseling details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS counseling_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      counselorName VARCHAR(255),
      topics JSON,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  // Confirmation details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS confirmation_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      sponsorName VARCHAR(255),
      baptismalCert VARCHAR(255),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);

  // Document request details
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS document_request_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      documentType VARCHAR(255),
      purpose TEXT,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    )
  `);
}

/* ----------------------------------------
   DEMO DATA SEEDING
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

  // Seed sample appointment
  const [appt] = await conn.execute(
    `INSERT INTO appointments (name, email, contactNumber, serviceType, date, time, party_size, status)
     VALUES ('Shawn Robertson', 'shawn@example.com', '0917-123-4567', 'Baptism', '2025-09-20', '09:00 AM', 3, 'approved'),
     ('Shawn Robertson', 'shawn@example.com', '0917-123-4567', 'Baptism', '2025-09-20', '09:00 AM', 3, 'cancelled'),
     ('Shawn Robertson', 'shawn@example.com', '0917-123-4567', 'Baptism', '2025-09-20', '09:00 AM', 3, 'pending'),
     ('Shawn Robertson', 'shawn@example.com', '0917-123-4567', 'Baptism', '2025-09-20', '09:00 AM', 3, 'completed'),
     ('Shawn Robertson', 'shawn@example.com', '0917-123-4567', 'Baptism', '2025-09-20', '09:00 AM', 3, 'in_progress')`
  );

  const appointmentId = appt.insertId;
  await conn.execute(
    `INSERT INTO baptism_details (appointment_id, childFullName, fatherName, motherMaidenName, parentsMarriageType, sponsors)
     VALUES (?, 'Baby Robertson', 'John Robertson', 'Jane Doe', 'church', JSON_ARRAY('Godparent A','Godparent B'))`,
    [appointmentId]
  );
}
