const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  toggleBlockUser,
  checkBlockStatus,
  updateProfile,
  changeUsername,
  generateOtpInMail,
  verifyOtp,
  resetPassword,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authUser);
router.post("/block", protect, toggleBlockUser);
router.get("/check-block-status", protect, checkBlockStatus);
router.get("/", protect, allUsers);
router.post("/", registerUser);

router.put("/update-profile", protect, updateProfile);
router.put("/change-username", protect, changeUsername);

router.post("/generate-otp", generateOtpInMail);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
