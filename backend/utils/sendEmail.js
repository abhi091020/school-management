// utils/sendEmail.js (Modernized to ES Module)

import nodemailer from "nodemailer"; // FIX: Use ES Module import
import logger from "./logger.js"; // FIX: Import logger with .js extension

/* ========================================================
    LOG ENV (Keep for debugging on startup)
======================================================== */
function logEnv() {
  console.log("🔍 ENV CHECK (Email):");
  console.log("EMAIL_PROVIDER =", process.env.EMAIL_PROVIDER);
  console.log("EMAIL_USER =", process.env.EMAIL_USER);
  console.log(
    "EMAIL_PASS =",
    process.env.EMAIL_PASS ? "(loaded)" : "(missing!)"
  );
}
logEnv();

/* ========================================================
    SMTP TRANSPORTER (Use Modern async/await in verify)
======================================================== */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.error("❌ Missing EMAIL_USER or EMAIL_PASS");
    return null;
  }

  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();

  let config = {};

  // FINAL FIXED GMAIL CONFIG
  if (provider === "gmail") {
    config = {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  } else {
    // Other SMTP providers
    config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  }

  console.log("⚙️ SMTP CONFIG:", config);

  transporter = nodemailer.createTransport(config);

  // Use a promise-based verify for cleaner async startup
  transporter
    .verify()
    .then(() => {
      console.log("📨 SMTP connection ready ✓");
    })
    .catch((err) => {
      console.error("❌ SMTP verify failed:", err.message);
      logger.error("SMTP verify failed", { error: err.message });
    });

  return transporter;
}

/* ========================================================
    SEND WITH SMTP
======================================================== */
async function sendWithSMTP({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) return false;

  try {
    await mailer.sendMail({
      from: `"School System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 SMTP email SENT → ${to}`);
    return true;
  } catch (err) {
    console.error("❌ SMTP send FAILED:", err.message);
    logger.error("SMTP send FAILED", {
      recipient: to,
      error: err.message,
      stack: err.stack,
    });
    return false;
  }
}

/* ========================================================
    MASTER SEND FUNCTION (Default Export)
======================================================== */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error("Recipient email required");
  if (!subject) throw new Error("Email subject required");

  console.log(`📤 Sending email → ${to}`);

  const ok = await sendWithSMTP({ to, subject, text, html });

  if (!ok) {
    console.error("❌ EMAIL NOT SENT");
    return { success: false };
  }

  return { success: true };
};

/* ========================================================
    HTML TEMPLATE (Named Export)
======================================================== */
export const buildTemplate = (title, body) => `
  <div style="font-family:Arial;padding:20px;max-width:600px;margin:auto;border:1px solid #eee;border-radius:5px;">
    <h2 style="color:#333;">${title}</h2>
    <p style="color:#555;line-height:1.6;">${body}</p>
    <br/>
    <small style="color:#999;font-size:11px;">This is an automated email. Please do not reply.</small>
  </div>
`;

// FIX: Use ES Module default export
export default sendEmail;
