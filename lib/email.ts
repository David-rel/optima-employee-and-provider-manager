import nodemailer from "nodemailer";

// Create transporter for sending emails via Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Send email verification code
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string
) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Verify Your Email - Optima Medical",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #003366, #5BA3D0); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Optima</h1>
            <p style="color: #5BA3D0; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 3px;">MEDICAL</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #003366; margin-top: 0;">Verify Your Email Address</h2>
            <p>Hi ${name},</p>
            <p>Thank you for signing up! Please verify your email address by entering the code below:</p>
            <div style="background: white; border: 2px solid #5BA3D0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #003366; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Optima Medical. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      Thank you for signing up! Please verify your email address by entering the code below:
      
      ${code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email.
      
      © ${new Date().getFullYear()} Optima Medical. All rights reserved.
    `,
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Verify transporter connection (optional, for testing)
 */
export async function verifyEmailConnection() {
  return await transporter.verify();
}
