const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "abhishekbhore9@gmail.com",
    pass: "nmlbibjekjtgefle",
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((err, success) => {
  if (err) console.error("❌ VERIFY ERROR:", err.message);
  else console.log("📨 SMTP READY ✓");
});

transporter
  .sendMail({
    from: '"Test" <abhishekbhore9@gmail.com>',
    to: "abhishekbhore9@gmail.com",
    subject: "SMTP Test",
    text: "If you receive this, SMTP works.",
  })
  .then(() => console.log("📧 EMAIL SENT"))
  .catch((err) => console.error("❌ SEND ERROR:", err.message));
