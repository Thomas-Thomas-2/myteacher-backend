/*var express = require('express');
var router = express.Router();

const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const cloudinary = require('cloudinary').v2;
const uniqid = require('uniqid');
const fs = require('fs');

// Join chat
router.put('/:username', (req, res) => {
  pusher.trigger('chat', 'join', { username: req.params.username });

  res.json({ result: true });
});

// Leave chat
router.delete("/:username", (req, res) => {
  pusher.trigger('chat', 'leave', { username: req.params.username });

  res.json({ result: true });
});

// Send message
router.post('/', async (req, res) => {
  const message = req.body;

  if (message.type === 'audio') {
    const audioPath = `./tmp/${uniqid()}.m4a`;
    const resultMove = await req.files.audio.mv(audioPath);

    if (!resultMove) {
      const resultCloudinary = await cloudinary.uploader.upload(audioPath, { resource_type: 'video' });
      message.url = resultCloudinary.secure_url;
      fs.unlinkSync(audioPath);
    } else {
      res.json({ result: false, error: resultMove });
      return;
    }
  }

  pusher.trigger('chat', 'message', message);

  res.json({ result: true });
});

module.exports = router;*/

// SocketIO
var express = require("express");
var router = express.Router();

require("../models/connection");

const Conversation = require("../models/conversations");
const Message = require("../models/messages");
const Teacher = require("../models/teachers");
const Student = require("../models/students");
const User = require("../models/users");
const authMiddleware = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

// GET /messages/conversations
router.get("/conversations", authMiddleware, async function (req, res) {
  try {
    console.log("req.user =", req.user);

    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({ user: req.user.userId });
      console.log("teacher found =", teacher);

      if (!teacher) {
        return res.status(404).json({
          result: false,
          error: "Teacher not found",
        });
      }

      const conversations = await Conversation.find({ teacher: teacher._id })
        .populate({
          path: "student",
          populate: { path: "user", model: "users" },
        })
        .sort({ lastMessageAt: -1 });

      console.log("teacher conversations =", conversations);

      const formatted = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.countDocuments({
            conversation: conv._id,
            senderRole: "student",
            readBy: { $ne: "teacher" },
          });

          return {
            _id: conv._id,
            studentId: conv.student?._id || null,
            studentName: conv.student
              ? `${conv.student.user?.firstName || conv.student.firstName || ""} ${conv.student.user?.lastName || conv.student.lastName || ""}`.trim()
              : "Élève",
            lastMessage: conv.lastMessage || "",
            lastMessageAt: conv.lastMessageAt || null,
            lastSenderRole: conv.lastSenderRole || "",
            unreadCount,
          };
        }),
      );

      console.log("formatted teacher conversations =", formatted);

      return res.json({ result: true, conversations: formatted });
    }

    if (req.user.role === "student") {
      const student = await Student.findOne({ user: req.user.userId });
      console.log("student found =", student);

      if (!student) {
        return res.status(404).json({
          result: false,
          error: "Student not found",
        });
      }

      const conversations = await Conversation.find({ student: student._id })
        .populate({
          path: "teacher",
          populate: { path: "user", model: "users" },
        })
        .sort({ lastMessageAt: -1 });

      console.log("student conversations =", conversations);

      const formatted = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.countDocuments({
            conversation: conv._id,
            senderRole: "teacher",
            readBy: { $ne: "student" },
          });

          return {
            _id: conv._id,
            teacherId: conv.teacher?._id || null,
            teacherName: conv.teacher
              ? `${conv.teacher.user?.firstName || ""} ${conv.teacher.user?.lastName || ""}`.trim()
              : "Professeur",
            lastMessage: conv.lastMessage || "",
            lastMessageAt: conv.lastMessageAt || null,
            lastSenderRole: conv.lastSenderRole || "",
            unreadCount,
          };
        }),
      );

      console.log("formatted student conversations =", formatted);

      return res.json({ result: true, conversations: formatted });
    }

    return res.status(403).json({ result: false, error: "Forbidden" });
  } catch (error) {
    console.error("GET /messages/conversations error =", error);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// GET /messages/conversations/:id/messages
router.get(
  "/conversations/:id/messages",
  authMiddleware,
  async function (req, res) {
    try {
      const conversation = await Conversation.findById(req.params.id);

      if (!conversation) {
        return res
          .status(404)
          .json({ result: false, error: "Conversation not found" });
      }

      if (req.user.role === "teacher") {
        const teacher = await Teacher.findOne({ user: req.user.userId });
        if (!teacher || String(teacher._id) !== String(conversation.teacher)) {
          return res.status(403).json({ result: false, error: "Forbidden" });
        }
      }

      if (req.user.role === "student") {
        const student = await Student.findOne({ user: req.user.userId });
        if (!student || String(student._id) !== String(conversation.student)) {
          return res.status(403).json({ result: false, error: "Forbidden" });
        }
      }

      const messages = await Message.find({
        conversation: conversation._id,
      }).sort({
        createdAt: 1,
      });

      return res.json({ result: true, messages });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

// POST /messages/conversations/student/:studentId
// teacher -> créer ou récupérer sa conversation avec un élève
router.post(
  "/conversations/student/:studentId",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      const teacher = await Teacher.findOne({ user: req.user.userId });
      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher not found" });
      }

      const student = await Student.findOne({
        _id: req.params.studentId,
        teacher: teacher._id,
      });

      if (!student) {
        return res
          .status(404)
          .json({ result: false, error: "Student not found" });
      }

      let conversation = await Conversation.findOne({
        teacher: teacher._id,
        student: student._id,
      });

      if (!conversation) {
        conversation = await Conversation.create({
          teacher: teacher._id,
          student: student._id,
          lastMessage: "",
          lastMessageAt: null,
          lastSenderRole: "teacher",
        });
      }

      return res.json({ result: true, conversation });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

// POST conversations/my-teacher
router.post(
  "/conversations/my-teacher",
  authMiddleware,
  requireRole("student"),
  async function (req, res) {
    try {
      const student = await Student.findOne({ user: req.user.userId });

      if (!student) {
        return res
          .status(404)
          .json({ result: false, error: "Student not found" });
      }

      if (!student.teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher not linked" });
      }

      let conversation = await Conversation.findOne({
        teacher: student.teacher,
        student: student._id,
      });

      if (!conversation) {
        conversation = await Conversation.create({
          teacher: student.teacher,
          student: student._id,
          lastMessage: "",
          lastMessageAt: null,
          lastSenderRole: "student",
        });
      }

      return res.json({ result: true, conversation });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

module.exports = router;
