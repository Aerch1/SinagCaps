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
  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${process.env.DB_HOST}`);

    // Drop existing table if it exists (for development only)
    if (process.env.NODE_ENV === "development") {
      await connection.execute("DROP TABLE IF EXISTS users");
      console.log("🗑️ Dropped existing users table");
    }

    // Create users table with all required columns
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        lastLogin TIMESTAMP NULL,
        isVerified BOOLEAN DEFAULT FALSE,
        resetPasswordToken VARCHAR(255) NULL,
        resetPasswordExpiresAt TIMESTAMP NULL,
        verificationToken VARCHAR(6) NULL,
        verificationTokenExpiresAt TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table created successfully");

    // Create default admin user in development
    if (process.env.NODE_ENV === "development") {
      const [rows] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        ["admin@example.com"]
      );
      if (rows.length === 0) {
        const bcryptjs = await import("bcryptjs");
        const hashedPassword = await bcryptjs.default.hash("admin123", 12);
        await connection.execute(
          "INSERT INTO users (name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)",
          ["Admin User", "admin@example.com", hashedPassword, "admin", true]
        );
        console.log(
          "✅ Default admin user created: admin@example.com / admin123"
        );
      }
    }

    console.log("✅ Database initialization completed");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

export default pool;
