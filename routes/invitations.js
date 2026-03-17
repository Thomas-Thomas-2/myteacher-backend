const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const Invitation = require("../models/invitations");
const Teacher = require("../models/teachers");
const User = require("../models/users");
const Student = require("../models/students");

const { sendInviteEmail } = require("../services/mailer");

//-------------------------Helpers---------------------------------------------

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

//----------------------------Routes---------------------------------------

// POST /invitations  (teacher only)
router.post("/", authMiddleware, requireRole("teacher"), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ result: false, error: "Missing fields" });
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier teacher profile
    const teacher = await Teacher.findOne({ user: req.user.userId });
    if (!teacher) {
      return res
        .status(404)
        .json({ result: false, error: "Teacher profile not found" });
    }

    // Empêcher d’inviter un email déjà inscrit
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(409)
        .json({ result: false, error: "Email already used" });
    }

    // Refuser si une invitation active existe déjà pour cet email (pour ce prof)
    const existingActiveInvite = await Invitation.findOne({
      teacher: teacher._id,
      email: normalizedEmail,
      acceptedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (existingActiveInvite) {
      return res.status(409).json({
        result: false,
        error: "Active invitation already exists for this email",
      });
    }

    // Générer token brut + hash
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    await Invitation.create({
      teacher: teacher._id,
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    });

    // Lien d’invite
    const inviteLink = new URL(
      `/signup_student?token=${token}`,
      process.env.FRONT_URL,
    ).toString();

    // Envoi email (best effort)
    let emailSent = false;
    let emailError = null;

    try {
      console.log("[INVITE] about to send email to:", normalizedEmail);
      const info = await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        teacherLabel: teacher?.displayName || teacher?.name || "Un professeur",
      });
      const okSent = !!info?.data?.id && !info?.error;

      emailSent = okSent;
      if (!okSent) {
        emailError = info?.error?.message || "Email provider error";
      }
      console.log("[INVITE] email send result:", {
        providerId: info?.data?.id || info?.id,
        error: info?.error,
      });
    } catch (mailErr) {
      emailError = mailErr?.message || String(mailErr);
      console.error("MAIL ERROR:", {
        message: mailErr?.message,
        code: mailErr?.code,
        response: mailErr?.response,
        responseCode: mailErr?.responseCode,
        command: mailErr?.command,
      });
    }

    return res.status(201).json({
      result: true,
      expiresAt,
      emailSent,
      inviteLink,
      emailError,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// GET /resolve
router.get("/resolve", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ result: false, error: "Missing token" });
    }

    const tokenHash = hashToken(token);
    const invitation = await Invitation.findOne({ tokenHash });

    if (!invitation) {
      return res
        .status(400)
        .json({ result: false, error: "Invalid invitation" });
    }

    if (invitation.acceptedAt) {
      return res
        .status(400)
        .json({ result: false, error: "Invitation already used" });
    }

    if (invitation.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ result: false, error: "Invitation expired" });
    }

    return res.json({
      result: true,
      invitation: {
        email: invitation.email,
        firstName: invitation.firstName || "",
        lastName: invitation.lastName || "",
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
