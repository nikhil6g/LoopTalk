const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const BlockList = require("../models/BlockListModel");
const generateToken = require("../config/generateToken");
const { generateOtp, hashOtp, isOtpExpired } = require("../utils/otp");
const { sendEmail } = require("../utils/email");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

//@description     block the user if not blocked , unblock if blocked
//@route           GET /api/block
//@access          Protected
const toggleBlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body; // The ID of the user to block/unblock
  const currentUserId = req.user._id; // The ID of the currently logged-in user

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  if (userId === currentUserId.toString()) {
    return res
      .status(400)
      .json({ message: "You cannot block/unblock yourself" });
  }

  try {
    // Check if the target user exists in the database
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }
    // Check if the user is already blocked
    const existingBlock = await BlockList.findOne({
      blocker: currentUserId,
      blocked: userId,
    });

    if (existingBlock) {
      // Unblock the user if they are already blocked
      await BlockList.deleteOne({ _id: existingBlock._id });
      return res
        .status(200)
        .json({ message: `User ${userId} has been unblocked` });
    } else {
      // Block the user if they are not already blocked
      const newBlock = new BlockList({
        blocker: currentUserId,
        blocked: userId,
      });
      await newBlock.save();
      return res
        .status(200)
        .json({ message: `User ${userId} has been blocked` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

//@description     Check if the user is blocked by the current user
//@route           Get /api/user/check-block-status?userId=
//@access          Protected
const checkBlockStatus = asyncHandler(async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "User ID whom want to be blocked, is required." });
  }

  try {
    const blockerId = req.user._id;

    // Check if the blockerId has blocked the userId
    const isBlocked = await BlockList.findOne({
      blocker: blockerId,
      blocked: userId,
    });

    if (isBlocked) {
      return res.status(200).json({ isBlocked: true });
    } else {
      return res.status(200).json({ isBlocked: false });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

//@description     Auth the user
//@route           POST /api/user/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// @description: Generate and send an OTP to the user via email.
// @route: POST /api/user/generate-otp
// @access: Public
const generateOtpInMail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  if (
    user.otp &&
    user.otpExpiresAt &&
    user.otpExpiresAt - 8 * 60 * 1000 < Date.now()
  ) {
    res.status(400);
    throw new Error("OTP is already sent to your email.");
  }
  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);
  const otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  user.otp = hashedOtp;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  try {
    await sendEmail(email, otp);
    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (err) {
    console.error("Error sending email:", err);
    res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again later." });
  }
});

// @description: Verify the OTP provided by the user.
// @route: POST /api/user/verify-otp
// @access: Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error("Email and OTP are required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (!user.otp || !user.otpExpiresAt) {
    res.status(400);
    throw new Error("No OTP found. Please request a new one.");
  }

  if (isOtpExpired(user.otpExpiresAt)) {
    res.status(400);
    throw new Error("OTP has expired. Please request a new one.");
  }

  const hashedOtp = hashOtp(otp);

  if (hashedOtp !== user.otp) {
    res.status(400);
    throw new Error("Invalid OTP.");
  }

  res.status(200).json({ message: "OTP verified successfully." });
});

// @description: Reset the user's password after OTP verification.
// @route: POST /api/user/reset-password
// @access: Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error("Email, OTP, and new password are required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (!user.otp || !user.otpExpiresAt) {
    res.status(400);
    throw new Error("No OTP found. Please request a new one.");
  }

  if (isOtpExpired(user.otpExpiresAt)) {
    res.status(400);
    throw new Error("OTP has expired. Please request a new one.");
  }

  const hashedOtp = hashOtp(otp);

  if (hashedOtp !== user.otp) {
    res.status(400);
    throw new Error("Invalid OTP.");
  }

  user.password = newPassword;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  res.status(200).json({ message: "Password reset successfully." });
});

module.exports = {
  allUsers,
  toggleBlockUser,
  registerUser,
  authUser,
  checkBlockStatus,
  generateOtpInMail,
  verifyOtp,
  resetPassword,
};
