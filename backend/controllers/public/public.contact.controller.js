import dotenv from "dotenv";
import Brevo from "@getbrevo/brevo";

dotenv.config();

/* ==================================================
   📩 POST /api/public/contact
   → Sends message to parish email & confirmation to sender
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

    // ✅ Configure Brevo API client
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    // ✅ Parish email
    const parishEmail = process.env.PARISH_EMAIL || process.env.EMAIL_USER;

    // ==================================================
    // 1️⃣ Send message to parish inbox
    // ==================================================
    const parishMail = {
      sender: { name: `${firstName} ${lastName}`, email: email }, // ✅ real sender
      replyTo: { email },
      to: [{ email: parishEmail }],
      subject: `Parish Inquiry: ${subject}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333; background: #fff; padding: 20px;">
          <h2 style="text-align: center; margin-bottom: 20px;">📩 New Contact Message</h2>

          <div style="margin-bottom: 16px;">
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#1d4ed8;">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>

          <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;">

          <div>
            <p style="margin-bottom: 8px;"><strong>Message:</strong></p>
            <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>

          <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">

          <p style="font-size: 12px; color: #666; text-align: center;">
            Sent via the Contact Form on the OLOPGV Parish Website.
          </p>
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(parishMail);

    // ==================================================
    // 2️⃣ Send confirmation to the sender
    // ==================================================
    const confirmationMail = {
      sender: {
        name: "Our Lady of Peace and Good Voyage Parish",
        email: parishEmail, // ✅ official parish sender
      },
      to: [{ email }], // ✅ receiver = person who filled the form
      subject: "Thank you for contacting OLOPGV Parish",
      htmlContent: `
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
            <a href="mailto:${parishEmail}" style="color:#1d4ed8;">${parishEmail}</a>
          </p>
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(confirmationMail);

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
