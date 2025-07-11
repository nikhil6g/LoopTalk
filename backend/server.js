const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { authenticateUser } = require("./middleware/authMiddleware");
const {
  sendMessageHandler,
  getAiResponse,
} = require("./controllers/messageControllers");
const Message = require("./models/messageModel");
const Chat = require("./models/chatModel");

const path = require("path");
const cors = require("cors");

dotenv.config();
connectDB();
const app = express();

app.use(
  cors({
    origin: "*", // Frontend origins
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

app.use(express.json()); // to accept json data

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on PORT ${PORT}...`.yellow.bold);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    Credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    socket.user = await authenticateUser(token);
    next();
  } catch (error) {
    console.error("Socket Auth Error:", error);
    return next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("leave chat", (room) => {
    socket.leave(room);
    console.log("User Left Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  const handleNewMessage = async (
    senderId,
    content,
    chatId,
    mediaUrl,
    mediaType
  ) => {
    try {
      const currentChat = await Chat.findById(chatId).populate("users");
      //handle ai chat bot response
      var isBot = false;
      var botId = null;
      if (currentChat.users.length == 2) {
        currentChat.users.forEach((user) => {
          if (user._id.toString() !== senderId && user.email.endsWith("bot")) {
            isBot = true;
            botId = user._id;
          }
        });
      }

      if (isBot) {
        const messageForBot = await Message.create({
          chat: chatId,
          sender: senderId,
          content: content,
          readBy: botId,
        });

        await messageForBot.populate("sender", "name pic");
        await messageForBot.populate("chat");
        await messageForBot.populate({
          path: "chat.users",
          select: "name pic email",
        });

        socket.emit("Message sended", messageForBot);
        socket.emit("typing");
        const botMessage = await getAiResponse(content, senderId, chatId);
        socket.emit("message recieved", botMessage);
        socket.emit("stop typing");
        return;
      }

      let messages = await sendMessageHandler(
        senderId,
        content,
        mediaUrl,
        mediaType,
        chatId
      );
      if (messages.length > 1) {
        // this is broadcast message , and messages[0] is the group chat for the broadcast message
        messages = messages.slice(1);
        messages.forEach((message) => {
          var chat = message.chat;

          if (!chat.users) return console.log("chat.users not defined");
          chat.users.forEach((user) => {
            if (user._id.toString() === message.sender._id.toString()) return;

            socket.in(user._id.toString()).emit("message recieved", message);
          });
        });
      } else {
        var chat = messages[0].chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
          if (user._id.toString() === messages[0].sender._id.toString()) return;
          socket.in(user._id.toString()).emit("message recieved", messages[0]);
        });
      }
      socket.emit("Message sended", messages[0]);
    } catch (error) {
      console.log(error.message);
      socket.emit("Error", { message: error.message });
    }
  };

  socket.on("New message", (newMessage) => {
    const { content, chatId, senderId, mediaUrl, mediaType } = newMessage;

    handleNewMessage(senderId, content, chatId, mediaUrl, mediaType);
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    socket.leave(socket.user?._id);
  });
});
module.exports = app;
