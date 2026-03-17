const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "teachers",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "students",
      required: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastSenderRole: {
      type: String,
      enum: ["teacher", "student"],
      default: "teacher",
    },
  },
  { timestamps: true },
);

conversationSchema.index({ teacher: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("conversations", conversationSchema);
