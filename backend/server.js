const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
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

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  try {
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });
  } catch (err) {
    console.error("Socket setup error: ", err);
  }

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    //console.log(newMessageRecieved);
    if (newMessageRecieved.length > 1) {
      newMessageRecieved = newMessageRecieved.slice(1);
      //console.log(newMessageRecieved);
      newMessageRecieved.forEach((message) => {
        var chat = message.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
          if (user._id == message.sender._id) return;

          socket.in(user._id).emit("message recieved", message);
        });
      });
    } else {
      var chat = newMessageRecieved[0].chat;

      if (!chat.users) return console.log("chat.users not defined");

      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved[0].sender._id) return;

        socket.in(user._id).emit("message recieved", newMessageRecieved[0]);
      });
    }
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
module.exports = app;
