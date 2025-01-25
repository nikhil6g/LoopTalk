const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const BlockList = require("../models/BlockListModel");
const generateToken = require("../config/generateToken");

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
//@route           POST /api/users/login
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

module.exports = {
  allUsers,
  toggleBlockUser,
  registerUser,
  authUser,
  checkBlockStatus,
};
