import dotenv from "dotenv";
import Brevo from "@getbrevo/brevo";

dotenv.config();

/* ==================================================
   📩 POST /api/public/contact
   → Sends message to parish inbox & confirmation to sender
================================================== */
export async function sendContactMessage(req, res) {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  // ✅ Basic validation
  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: "All required fields must be filled.",
    });
  }

  try {
    /* ==================================================
       ⚙️ Brevo setup
    ================================================== */
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const senderEmail = process.env.PARISH_EMAIL; // ✉️ official sender (noreply)
    const parishInbox = process.env.PARISH_INBOX_EMAIL || senderEmail; // 📥 where message is sent
    const parishName =
      process.env.EMAIL_FROM_NAME || "Our Lady of Peace and Good Voyage Parish";

    /* ==================================================
       1️⃣ Send message to Parish Inbox
    ================================================== */
    const parishMail = {
      sender: { name: parishName, email: senderEmail }, // ✅ use verified domain
      replyTo: { email }, // user email here so parish can reply
      to: [{ email: parishInbox }],
      subject: `Parish Inquiry: ${subject}`,
      htmlContent: `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2 style="text-align: center; margin-bottom: 20px;">📩 New Contact Message</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#1d4ed8;">${email}</a></p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;">
      <p style="margin-bottom: 8px;"><strong>Message:</strong></p>
      <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
      <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
      <p style="font-size: 12px; color: #666; text-align: center;">
        Sent via the Contact Form on the OLOPGV Parish Website.
      </p>
    </div>
  `,
    };

    await apiInstance.sendTransacEmail(parishMail);

    /* ==================================================
       2️⃣ Send confirmation to the sender
    ================================================== */
    const confirmationMail = {
      sender: { name: parishName, email: senderEmail },
      to: [{ email }],
      subject: "Thank you for contacting OLOPGV Parish",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="text-align: center; margin-bottom: 16px;">🙏 Thank You, ${firstName}!</h2>
          <p style="margin-bottom: 12px;">
            We have received your message regarding <strong>"${subject}"</strong>.<br>
            Our parish team will review your inquiry and respond as soon as possible.
          </p>

          <p style="font-size: 13px; color: #666; margin-top: 20px;">
            God bless you,<br>
            <strong>${parishName}</strong><br>
            Lodlod, Lipa City, Batangas<br>
            <a href="mailto:${senderEmail}" style="color:#1d4ed8;">${senderEmail}</a>
          </p>
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(confirmationMail);
    console.log({
      brevo: process.env.BREVO_API_KEY ? "✅ loaded" : "❌ missing",
      sender: process.env.PARISH_EMAIL,
      inbox: process.env.PARISH_INBOX_EMAIL,
      name: process.env.EMAIL_FROM_NAME,
    });

    return res.json({
      success: true,
      message:
        "Message sent successfully! A confirmation email has been sent to your inbox.",
    });
  } catch (error) {
    console.error("❌ Contact form error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again later.",
    });
  }
}
