const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema({
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
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lessons",
    required: false,
  },
  invoiceNumber: {
    type: String,
    unique: true,
  },
  period: String,
  label: String,
  amount: Number,
  status: {
    type: String,
    enum: ["scheduled", "pending", "paid", "late"],
    default: "scheduled",
  },
  dueAt: Date,
  pdfURL: String,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,

  // Gestion du "payé"
  currency: { type: String, default: "EUR" },
  provider: {
    type: String,
    enum: ["manual", "stripe", "paypal"],
    default: "manual",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "check", "transfer", "card", "paypal"],
    default: "cash",
  },
  externalRef: { type: String },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
});

const Invoice = mongoose.model("invoices", invoiceSchema);

module.exports = Invoice;
