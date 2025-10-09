import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // prevents cert errors in Railway
  },
});

// Optional: verify connection at startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email service configuration error:", err.message);
  } else {
    console.log("✅ Brevo SMTP connected successfully");
  }
});
