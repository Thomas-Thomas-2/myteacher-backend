const mongoose = require("mongoose");
const validator = require("validator");

const studentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "teachers",
      required: true,
    },

    // ✅ utiles pour les prospects sans compte
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: "Invalid email",
      },
    },
    //////////////////////////////////////////

    avatarUrl: { type: String },
    phone: { type: String },
    discipline: {
      type: String,
      default: "",
    },
    structure: { type: String },
    status: {
      type: String,
      enum: ["Inactif", "Actif", "Prospect"],
      default: "Prospect",
    },
    subscription: {
      type: {
        type: String,
        enum: ["A l'unité", "Trimestre", "Annuel"],
      },
      price: { type: Number },
      modalite: { type: String },
    },
  },
  { timestamps: true },
);

// plusieurs prospects sans user sont autorisés
//un vrai user reste unique
studentSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $type: "objectId" } },
  },
);

module.exports = mongoose.model("students", studentSchema);
