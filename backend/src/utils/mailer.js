import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

// Fail fast in production (so you SEE misconfigurations)
if (!SMTP_USER || !SMTP_PASS) {
  console.warn("⚠️ SMTP credentials missing. Emails will NOT be sent.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.gmail.com",
  port: Number(SMTP_PORT) || 465,
  secure: SMTP_SECURE === "true", // true for 465, false for 587
  auth: SMTP_USER && SMTP_PASS
    ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      }
    : undefined,
});

// Verify connection ON STARTUP
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("📧 SMTP ready to send emails");
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn("📭 Email skipped (no SMTP config)");
      return;
    }

    if (!to) {
      throw new Error("Missing recipient email");
    }

    const info = await transporter.sendMail({
      from: `"JEDIDA" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📨 Email sent:", info.messageId);

    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
};
