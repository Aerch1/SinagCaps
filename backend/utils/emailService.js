import { transporter } from "../config/nodemailer.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  CHANGE_EMAIL_CODE_TEMPLATE, // 👈 new
  EMAIL_CHANGED_NOTICE_TEMPLATE,
} from "../config/emailTemplates.js";

const FROM = {
  name: "Your App Team",
  address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@example.com";

export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: {
        name: "Our Lady of Peace and Good Voyage - Lodlod,Lipa City",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Verify Your Email Address",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationCode
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent:", info.messageId);

    // For development with Ethereal, show preview URL
    if (process.env.NODE_ENV === "development" && info.previewURL) {
      console.log("📧 Preview URL:", info.previewURL);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: {
        name: "Our Lady of Peace and Good Voyage - Lodlod,Lipa City",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Welcome to Our Platform!",
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent:", info.messageId);

    if (process.env.NODE_ENV === "development" && info.previewURL) {
      console.log("📧 Preview URL:", info.previewURL);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    const mailOptions = {
      from: {
        name: "Our Lady of Peace and Good Voyage - Lodlod,Lipa City",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);

    if (process.env.NODE_ENV === "development" && info.previewURL) {
      console.log("📧 Preview URL:", info.previewURL);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendPasswordResetSuccessEmail = async (email) => {
  try {
    const mailOptions = {
      from: {
        name: "Our Lady of Peace and Good Voyage - Lodlod,Lipa City",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset success email sent:", info.messageId);

    if (process.env.NODE_ENV === "development" && info.previewURL) {
      console.log("📧 Preview URL:", info.previewURL);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset success email:", error);
    throw new Error(
      `Failed to send password reset success email: ${error.message}`
    );
  }
};

export async function sendChangeEmailCode(toEmail, code) {
  try {
    const html = CHANGE_EMAIL_CODE_TEMPLATE.replaceAll(
      "{code}",
      code
    ).replaceAll("{supportEmail}", SUPPORT_EMAIL);

    const info = await transporter.sendMail({
      from: FROM,
      to: toEmail,
      subject: "Confirm your new email address",
      html,
    });

    console.log("✅ Change-email code sent:", info.messageId);
    if (process.env.NODE_ENV === "development" && info.previewURL) {
      console.log("📧 Preview URL:", info.previewURL);
    }
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Error sending change-email code:", err);
    throw new Error(`Failed to send change-email code: ${err.message}`);
  }
}

export async function sendEmailChangedNotice(oldEmail, newEmail) {
  try {
    const html = EMAIL_CHANGED_NOTICE_TEMPLATE.replaceAll(
      "{oldEmail}",
      oldEmail
    )
      .replaceAll("{newEmail}", newEmail)
      .replaceAll("{supportEmail}", SUPPORT_EMAIL);

    // Notify the previous address (primary), and optionally the new one.
    const [toOld, toNew] = await Promise.all([
      transporter.sendMail({
        from: FROM,
        to: oldEmail,
        subject: "Your account email was changed",
        html,
      }),
      transporter.sendMail({
        from: FROM,
        to: newEmail,
        subject: "Your account email is now updated",
        html, // same body is OK; subjects differ
      }),
    ]);

    console.log(
      "✅ Email-changed notices sent:",
      toOld.messageId,
      toNew.messageId
    );
    if (process.env.NODE_ENV === "development") {
      if (toOld.previewURL)
        console.log("📧 Old-email preview:", toOld.previewURL);
      if (toNew.previewURL)
        console.log("📧 New-email preview:", toNew.previewURL);
    }

    return {
      success: true,
      oldMessageId: toOld.messageId,
      newMessageId: toNew.messageId,
    };
  } catch (err) {
    console.error("❌ Error sending email-changed notice:", err);
    throw new Error(`Failed to send email-changed notice: ${err.message}`);
  }
}
