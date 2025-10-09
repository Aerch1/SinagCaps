import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // Brevo uses 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // prevents self-signed cert issues in Brevo
  },
});

// ✅ Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service configuration error:", error.message);
  } else {
    console.log("✅ Brevo SMTP is ready to send emails");
  }
});
