const mongoose = require("mongoose");

const ressourceSchema = mongoose.Schema({
  teacherId: mongoose.Types.ObjectId,
  studentId: [{ type: mongoose.Schema.Types.ObjectId, ref: "students" }],
  title: String,
  type: {
    type: String,
    enum: ["link", "file"],
  },
  url: String,
  tags: [String],
  createdAt: Date,
});

const Ressource = mongoose.model("ressources", ressourceSchema);

module.exports = Ressource;
