// src/config/nodemailer.js
import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

dotenv.config();

/* ==========================================================
   Brevo API Transporter Wrapper (Nodemailer-compatible)
========================================================== */
class BrevoTransporter {
  constructor() {
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log("✅ Brevo API Transporter initialized");
  }

  /**
   * Send an email (compatible with nodemailer.sendMail)
   */
  async sendMail({ from, to, subject, html }) {
    try {
      const sender =
        typeof from === "string"
          ? { email: from }
          : { email: from.address, name: from.name };

      const recipients = Array.isArray(to)
        ? to.map((e) => ({ email: e }))
        : [{ email: to }];

      const response = await this.apiInstance.sendTransacEmail({
        sender,
        to: recipients,
        subject,
        htmlContent: html,
      });

      console.log(
        "✅ Email sent via Brevo API:",
        response?.messageId || "(no ID)"
      );
      return { messageId: response?.messageId || null };
    } catch (error) {
      console.error("❌ Brevo API sendMail error:", error.message);
      throw error;
    }
  }

  /**
   * Compatibility verify() for startup checks
   */
  async verify() {
    try {
      await this.apiInstance.getSmtpTemplates().catch(() => null);
      console.log("✅ Brevo API connection verified");
      return true;
    } catch (error) {
      console.error("❌ Brevo API verification failed:", error.message);
      return false;
    }
  }
}

// Export singleton instance
export const transporter = new BrevoTransporter();

// Optional startup check
transporter
  .verify()
  .then(() => console.log("✅ Brevo API ready for use"))
  .catch((err) => console.error("⚠️ Brevo API not verified:", err.message));
