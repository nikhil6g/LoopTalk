require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async (userEmail, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Disable SSL certificate validation and should not be done in production mode as it promotes man-in-the-middle attacks
      }, // This is done to avoid the error: self signed certificate in certificate chain
    });
    const mailOption = {
      from: process.env.EMAIL_ID,
      to: userEmail,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };
    await transporter.sendMail(mailOption);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = { sendEmail };
