const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (to, otp, name) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Password Reset OTP – Noah Automotive",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#6C5CE7;">Noah Automotive</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Use the OTP below:</p>
        <div style="background:#f4f4f4;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#6C5CE7;">${otp}</span>
        </div>
        <p>This code is valid for <strong>1 minute</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#888;font-size:12px;">© Noah Automotive. All rights reserved.</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };
