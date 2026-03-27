const mongoose = require("mongoose");

const messageBisSchema = mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  senderUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
});

messageBisSchema.index({ teacherId: 1, studentId: 1, createdAt: 1 });

const MessageBis = mongoose.model("messagesBis", messageBisSchema);
module.exports = MessageBis;
