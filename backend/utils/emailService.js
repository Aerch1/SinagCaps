// src/utils/email/email.js
import { transporter } from "../config/nodemailer.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  CHANGE_EMAIL_CODE_TEMPLATE,
  EMAIL_CHANGED_NOTICE_TEMPLATE,
} from "../config/emailTemplates.js";

const FROM = {
  name:
    process.env.EMAIL_FROM_NAME || "Our Lady of Peace and Good Voyage Parish",
  address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@olopgv.org";

/* ==========================================================
   📧 EMAIL: Verification
========================================================== */
export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const html = VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      verificationCode
    );

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Verify Your Email Address",
      html,
    });

    console.log("✅ Verification email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/* ==========================================================
   🎉 EMAIL: Welcome
========================================================== */
export const sendWelcomeEmail = async (email, name) => {
  try {
    const html = WELCOME_EMAIL_TEMPLATE.replace("{name}", name);

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Welcome to Our Platform!",
      html,
    });

    console.log("✅ Welcome email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/* ==========================================================
   🔐 EMAIL: Password Reset Request (async fire-and-forget)
========================================================== */
export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
      "{resetURL}",
      resetURL
    );

    // Fire-and-forget email sending
    transporter
      .sendMail({
        from: FROM,
        to: email,
        subject: "Reset Your Password",
        html,
      })
      .then((info) =>
        console.log("✅ Password reset email sent:", info.messageId)
      )
      .catch((error) =>
        console.error("❌ Error sending password reset email:", error)
      );

    // Return immediately
    return { success: true };
  } catch (error) {
    // This catch is mostly for synchronous errors (unlikely)
    console.error("❌ Unexpected error preparing password reset email:", error);
    return { success: false };
  }
};

/* ==========================================================
   ✅ EMAIL: Password Reset Successful
========================================================== */
export const sendPasswordResetSuccessEmail = async (email) => {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });

    console.log("✅ Password reset success email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending password reset success email:", error);
    throw new Error(
      `Failed to send password reset success email: ${error.message}`
    );
  }
};

/* ==========================================================
   ✉️ EMAIL: Change Email Code
========================================================== */
export const sendChangeEmailCode = async (toEmail, code) => {
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

    console.log("✅ Change email code sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending change email code:", error);
    throw new Error(`Failed to send change-email code: ${error.message}`);
  }
};

/* ==========================================================
   🔄 EMAIL: Email Changed Notice
========================================================== */
export const sendEmailChangedNotice = async (oldEmail, newEmail) => {
  try {
    const html = EMAIL_CHANGED_NOTICE_TEMPLATE.replaceAll(
      "{oldEmail}",
      oldEmail
    )
      .replaceAll("{newEmail}", newEmail)
      .replaceAll("{supportEmail}", SUPPORT_EMAIL);

    await Promise.all([
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
        html,
      }),
    ]);

    console.log("✅ Email change notices sent");
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending email change notice:", error);
    throw new Error(`Failed to send email change notice: ${error.message}`);
  }
};
