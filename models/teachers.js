const mongoose = require("mongoose");

const structureSchema = mongoose.Schema({
  name: { type: String, required: true },
  weekWorkLoad: Number,
  feesPlace: Number,
  accountability: Number,
  income: Number,
});

const teacherSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },

    avatarUrl: { type: String },
    phone: { type: String },
    address: { type: String },

    discipline: [{ type: String }],
    structures: [structureSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("teachers", teacherSchema);
