import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/* ==================================================
   📩 POST /api/public/contact
   → Sends message to parish Gmail & confirmation to sender
================================================== */
export async function sendContactMessage(req, res) {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  try {
    // ✅ Basic validation
    if (!firstName || !lastName || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All required fields must be filled." });
    }

    // ✅ Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail (App Password enabled)
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    /* ==================================================
       1️⃣ Send message to the parish Gmail inbox
    ================================================== */
    const parishMail = {
      from: `"${firstName} ${lastName}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.PARISH_EMAIL || process.env.EMAIL_USER,
      subject: `Parish Inquiry ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background: #fff; padding: 20px;">
          <h2 style="text-align: center; margin-bottom: 20px;">📩 New Contact Message</h2>

          <div style="margin-bottom: 16px;">
            <p style="margin: 4px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color:#1d4ed8;">${email}</a></p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${
              phone || "N/A"
            }</p>
            <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;">

          <div style="margin-top: 16px;">
            <p style="margin-bottom: 8px;"><strong>Message:</strong></p>
            <p style="white-space: pre-line; line-height: 1.6; margin: 0;">${message}</p>
          </div>

          <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

          <p style="font-size: 12px; color: #666; text-align: center;">
            Sent via the Contact Form on the OLOPGV Parish Website.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(parishMail);

    /* ==================================================
       2️⃣ Send confirmation email to the sender
    ================================================== */
    const confirmationMail = {
      from: `"Our Lady of Peace and Good Voyage Parish" <${process.env.PARISH_EMAIL}>`,
      to: email,
      subject: "Thank you for contacting OLOPGV Parish",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background: #fff; padding: 20px;">
          <h2 style="text-align: center; margin-bottom: 16px;">🙏 Thank You, ${firstName}!</h2>
          <p style="margin-bottom: 12px;">
            We have received your message regarding <strong>"${subject}"</strong>.
            Our parish team will review your inquiry and respond as soon as possible.
          </p>

          <p style="font-size: 13px; color: #666; margin-top: 20px;">
            God bless you,<br>
            <strong>Our Lady of Peace and Good Voyage Parish</strong><br>
            Lodlod, Lipa City, Batangas<br>
            <a href="mailto:${process.env.PARISH_EMAIL}" style="color:#1d4ed8;">${process.env.PARISH_EMAIL}</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(confirmationMail);

    // ✅ Success response
    res.json({
      success: true,
      message: "Message sent successfully! Confirmation email delivered.",
    });
  } catch (err) {
    console.error("❌ Contact form error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again later.",
    });
  }
}
