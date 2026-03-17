const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    },
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["teacher", "student"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        type: String,
        enum: ["teacher", "student"],
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("messages", messageSchema);
