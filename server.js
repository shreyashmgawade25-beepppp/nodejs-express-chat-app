const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chatapp";

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Could not load messages" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({ error: "Username and message are required" });
    }

    const saved = await Message.create({ username, message });
    io.emit("chat message", saved);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: "Could not save message" });
  }
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("chat message", async (data) => {
    try {
      if (!data.username || !data.message) return;

      const saved = await Message.create({
        username: data.username,
        message: data.message
      });

      io.emit("chat message", saved);
    } catch (error) {
      socket.emit("error message", "Message could not be saved");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

if (require.main === module) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      server.listen(3000, () => {
        console.log("Chat app running at http://localhost:3000");
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}

module.exports = { app, server, Message };