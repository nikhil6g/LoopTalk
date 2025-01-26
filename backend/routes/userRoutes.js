const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  toggleBlockUser,
  checkBlockStatus,
  generateOtpInMail,
  verifyOtp,
  resetPassword,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authUser);
router.route("/block").post(protect, toggleBlockUser);
router.route("/check-block-status").get(protect, checkBlockStatus);
router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/generate-otp", generateOtpInMail);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
