const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const BlockList = require("../models/blockListModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//Unused api just for testing purpose

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res
      .status(400)
      .json({ message: "Invalid data passed into request." });
  }
  try {
    // Fetch the chat using the provided chatId
    const chat = await Chat.findById(chatId).populate("users", "-password");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found." });
    }

    const senderId = req.user._id;
    const blockedUsers = await BlockList.find({
      $or: [{ blocker: senderId }, { blocked: senderId }],
    }).select("blocker blocked");

    const blockedBySender = new Set(
      blockedUsers
        .filter((b) => b.blocker.toString() === senderId.toString())
        .map((b) => b.blocked.toString())
    );
    const blockedSender = new Set(
      blockedUsers
        .filter((b) => b.blocked.toString() === senderId.toString())
        .map((b) => b.blocker.toString())
    );

    // for one-to-one chat if blocking applies then send suitable message
    if (!chat.isBroadcast && chat.users.length === 2) {
      const receiver = chat.users.find(
        (user) => user._id.toString() !== senderId.toString()
      );
      if (!receiver) {
        return res.status(400).json({ message: "Invalid chat participants." });
      }
      const receiverId = receiver._id.toString();

      if (blockedBySender.has(receiverId)) {
        return res
          .status(403)
          .json({ message: `You have blocked ${receiver.name}.` });
      }

      if (blockedSender.has(receiverId)) {
        return res
          .status(403)
          .json({ message: `${receiver.name} blocked you.` });
      }
    }

    const messages = [];
    const newMessage = {
      sender: senderId,
      content: content,
      chat: chatId,
    };

    let message = await Message.create(newMessage);

    await message.populate("sender", "name pic");
    await message.populate("chat");
    await message.populate({
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    messages.push(message);
    // Handle Broadcast Chat
    if (chat.isBroadcast) {
      const recipients = chat.users.filter((user) => {
        const userId = user._id.toString();
        return (
          userId !== senderId.toString() &&
          !blockedBySender.has(userId) &&
          !blockedSender.has(userId)
        );
      });
      for (const recipient of recipients) {
        // Skip the sender themselves
        if (recipient._id.toString() === senderId.toString()) continue;

        // Ensure a one-to-one chat exists or create one
        let isChat = await Chat.find({
          isGroupChat: false,
          $and: [
            { users: { $elemMatch: { $eq: senderId } } },
            { users: { $elemMatch: { $eq: recipient._id } } },
          ],
        })
          .populate("users", "-password")
          .populate("latestMessage");

        if (isChat.length === 0) {
          const chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [senderId, recipient._id],
          };

          const createdChat = await Chat.create(chatData);
          isChat = await Chat.findOne({ _id: createdChat._id }).populate(
            "users",
            "-password"
          );
        } else {
          isChat = isChat[0];
        }

        // Create and send a message to the one-to-one chat
        const newMessage = {
          sender: senderId,
          content: content,
          chat: isChat._id,
        };
        //console.log(isChat.chatName);
        let message = await Message.create(newMessage);

        await message.populate("sender", "name pic");
        await message.populate("chat");
        await message.populate({
          path: "chat.users",
          select: "name pic email",
        });

        await Chat.findByIdAndUpdate(isChat._id, { latestMessage: message });

        messages.push(message);
      }
    }
    res.status(200).json(messages); // Return the single group chat message
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const sendMessageHandler = async (senderId, content, chatId) => {
  if (!content || !chatId) {
    throw new Error("Invalid data passed into request.");
  }

  const chat = await Chat.findById(chatId).populate("users", "-password");

  if (!chat) {
    throw new Error("Chat not found.");
  }

  const blockedUsers = await BlockList.find({
    $or: [{ blocker: senderId }, { blocked: senderId }],
  }).select("blocker blocked");

  const blockedBySender = new Set(
    blockedUsers
      .filter((b) => b.blocker.toString() === senderId.toString())
      .map((b) => b.blocked.toString())
  );

  const blockedSender = new Set(
    blockedUsers
      .filter((b) => b.blocked.toString() === senderId.toString())
      .map((b) => b.blocker.toString())
  );

  if (!chat.isBroadcast && chat.users.length === 2) {
    const receiver = chat.users.find(
      (user) => user._id.toString() !== senderId.toString()
    );

    if (!receiver) {
      throw new Error("Invalid chat participants.");
    }

    const receiverId = receiver._id.toString();

    if (blockedBySender.has(receiverId)) {
      throw new Error(`You have blocked ${receiver.name}.`);
    }

    if (blockedSender.has(receiverId)) {
      throw new Error(`${receiver.name} blocked you.`);
    }
  }
  const messages = [];
  const newMessage = { sender: senderId, content: content, chat: chatId };
  let message = await Message.create(newMessage);

  await message.populate("sender", "name pic");
  await message.populate("chat");
  await message.populate({ path: "chat.users", select: "name pic email" });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
  messages.push(message);

  if (chat.isBroadcast) {
    const recipients = chat.users.filter((user) => {
      const userId = user._id.toString();
      return (
        userId !== senderId.toString() &&
        !blockedBySender.has(userId) &&
        !blockedSender.has(userId)
      );
    });
    for (const recipient of recipients) {
      if (recipient._id.toString() === senderId.toString()) continue;

      let isChat = await Chat.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq: senderId } } },
          { users: { $elemMatch: { $eq: recipient._id } } },
        ],
      })
        .populate("users", "-password")
        .populate("latestMessage");
      if (isChat.length === 0) {
        const chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [senderId, recipient._id],
        };

        const createdChat = await Chat.create(chatData);
        isChat = await Chat.findOne({ _id: createdChat._id }).populate(
          "users",
          "-password"
        );
      } else {
        isChat = isChat[0];
      }

      const newMessage = { sender: senderId, content, chat: isChat._id };
      let message = await Message.create(newMessage);
      await message.populate("sender", "name pic");
      await message.populate("chat");
      await message.populate({ path: "chat.users", select: "name pic email" });

      await Chat.findByIdAndUpdate(isChat._id, { latestMessage: message });

      messages.push(message);
    }
  }
  return messages;
};

module.exports = {
  allMessages,
  sendMessage,
  sendMessageHandler,
};
