const crypto = require("crypto");

// Generate a random OTP
const generateOtp = (length = 6) => {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

// Hash the OTP for secure storage
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// Validate OTP expiration
const isOtpExpired = (expiryDate) => {
  return new Date() > expiryDate; // Returns true if OTP is expired
};

module.exports = {
  generateOtp,
  hashOtp,
  isOtpExpired,
};
