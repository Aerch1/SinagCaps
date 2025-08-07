import { transporter } from "../config/nodemailer.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "../config/emailTemplates.js";

export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: {
        name: "Your App Team",
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
        name: "Your App Team",
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
        name: "Your App Team",
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
        name: "Your App Team",
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
