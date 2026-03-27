const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Pusher = require("pusher");
const MessageBis = require("../models/messagesBis");
const authMiddleware = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { checkBody } = require("../modules/checkBody");

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: process.env.CLUSTER,
  useTLS: true,
});

// Get all messages stored concerning one student on teacher side
router.get("/:studentId", authMiddleware, async (req, res) => {
  const { userId, role } = req.user;
  try {
    if (role === "teacher") {
      const studentId = req.params.studentId;
      const messages = await MessageBis.find({
        teacherId: userId,
        studentId,
      }).sort({ createdAt: 1 });
      return res.json({ result: true, messages });
    } else {
      return res
        .status(401)
        .json({ result: false, error: "Inappropriate request." });
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ result: false, error: "Error getting messages." });
  }
});

// Get all messages stored concerning one student
router.get("/", authMiddleware, async (req, res) => {
  const { userId, role } = req.user;
  try {
    if (role === "student") {
      const messages = await MessageBis.find({
        studentId: userId,
      }).sort({ createdAt: 1 });
      return res.json({ result: true, messages });
    } else {
      return res
        .status(401)
        .json({ result: false, error: "Inappropriate request." });
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ result: false, error: "Error getting messages." });
  }
});

// Send new message
router.post("/", authMiddleware, async (req, res) => {
  const { userId, role } = req.user;
  try {
    if (role === "teacher") {
      const { studentId, content } = req.body;
      const newMessage = await MessageBis.create({
        teacherId: userId,
        studentId,
        senderUser: userId,
        content,
      });
      pusher.trigger(`channel-${userId}-${studentId}`, "new-message", {
        message: newMessage,
      });
      return res.json({ result: true, message: newMessage });
    } else {
      const { teacherId, content } = req.body;
      const newMessage = await MessageBis.create({
        teacherId,
        studentId: userId,
        senderUser: userId,
        content,
      });
      pusher.trigger(`channel-${teacherId}-${userId}`, "new-message", {
        message: newMessage,
      });
      return res.json({ result: true, message: newMessage });
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ result: false, error: "Error posting message." });
  }
});

module.exports = router;
