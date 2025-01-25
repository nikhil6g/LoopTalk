const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  toggleBlockUser,
  checkBlockStatus,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authUser);
router.route("/block").post(protect, toggleBlockUser);
router.route("/check-block-status").get(protect, checkBlockStatus);
router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
module.exports = router;
