const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/users");
const Teacher = require("../models/teachers");
const Student = require("../models/students");
const Invitation = require("../models/invitations");
const authMiddleware = require("../middlewares/auth");

//---------------------------Helpers--------------------------------------

// Helper JWT cookie
function setAuthCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
}

// Helper lecture cookie
function getTokenFromReq(req) {
  // cookie first
  if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
}

// Helper hashToken
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

//-----------------------------Routes------------------------------------

// POST /users/signup/teacher
router.post("/signup/teacher", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    // validation simple
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ result: false, error: "Missing fields" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ result: false, error: "Password too short" });
    }
    // vérifier si email déjà utilisé
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ result: false, error: "Email already used" });
    }
    // hash password
    const passwordHash = await bcrypt.hash(password, 10);
    // create user
    const newUser = await User.create({
      role: "teacher",
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName,
      lastName,
    });
    // create teacher profile
    const newTeacher = await Teacher.create({
      user: newUser._id,
      discipline: [],
      structures: [],
    });
    // JWT
    const token = jwt.sign(
      { userId: newUser._id.toString(), role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    // cookie
    setAuthCookie(res, token);
    // response
    return res.status(201).json({
      result: true,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// POST /users/signup/student
router.post("/signup/student", async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;
    if (!token || !password || !firstName || !lastName) {
      return res.status(400).json({ result: false, error: "Missing fields" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ result: false, error: "Password too short" });
    }

    // retrouver invitation via hash
    const tokenHash = hashToken(token);
    const invitation = await Invitation.findOne({ tokenHash });
    if (!invitation) {
      return res
        .status(400)
        .json({ result: false, error: "Invalid invitation" });
    }

    // vérifier validité
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
    const email = invitation.email;

    // email déjà pris ?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ result: false, error: "Email already used" });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // create user student
    const newUser = await User.create({
      role: "student",
      email,
      passwordHash,
      firstName,
      lastName,
    });

    // create or attach student profile
    let studentProfile = await Student.findOne({
      teacher: invitation.teacher,
      email,
    });

    if (studentProfile) {
      studentProfile.user = newUser._id;
      studentProfile.firstName = newUser.firstName;
      studentProfile.lastName = newUser.lastName;
      studentProfile.email = newUser.email;
      studentProfile.status = "Actif";
      await studentProfile.save();
    } else {
      studentProfile = await Student.create({
        user: newUser._id,
        teacher: invitation.teacher,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        status: "Actif",
      });
    }

    // mark invitation used
    invitation.acceptedAt = new Date();
    await invitation.save();

    // JWT + cookie
    const jwtToken = jwt.sign(
      { userId: newUser._id.toString(), role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    setAuthCookie(res, jwtToken);
    return res.status(201).json({
      result: true,
    });
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      return res
        .status(409)
        .json({ result: false, error: "Email already used" });
    }
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// POST /users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ result: false, error: "Missing fields" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res
        .status(401)
        .json({ result: false, error: "Invalid credentials" });
    }
    const isOk = await bcrypt.compare(password, user.passwordHash);
    if (!isOk) {
      return res
        .status(401)
        .json({ result: false, error: "Invalid credentials" });
    }

    // Récupérer teacherId/studentId pour renvoyer au front
    let teacherId = null;
    let studentId = null;

    if (user.role === "teacher") {
      const teacher = await Teacher.findOne({ user: user._id });
      teacherId = teacher ? teacher._id : null;
    } else if (user.role === "student") {
      const student = await Student.findOne({ user: user._id });
      studentId = student ? student._id : null;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    setAuthCookie(res, token);
    return res.status(200).json({
      result: true,
      user: { role: user.role },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// GET /users/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user)
      return res.status(401).json({ result: false, error: "Unauthorized" });

    let teacherId = null;
    let studentId = null;

    if (user.role === "teacher") {
      const teacher = await Teacher.findOne({ user: user._id });
      teacherId = teacher ? teacher._id : null;
    } else if (user.role === "student") {
      const student = await Student.findOne({ user: user._id });
      studentId = student ? student._id : null;
    }
    return res.status(200).json({
      result: true,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        teacherId,
        studentId,
      },
    });
  } catch (e) {
    return res.status(401).json({ result: false, error: "Unauthorized" });
  }
});

// POST /users/logout
router.post("/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
  });

  return res.status(200).json({ result: true });
});

// POST /users/forgot_password
router.post("/forgot_password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ result: false, error: "Missing fields" });
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Toujours répondre pareil (évite d’indiquer si l’email existe)
    const genericResponse = { result: true };
    if (!user) return res.status(200).json(genericResponse);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordTokenHash = resetTokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // On renvoie le lien au lieu d'envoyer un email
    const resetLink = `${process.env.FRONT_URL}/reset_password?token=${resetToken}`;
    return res.status(200).json({
      ...genericResponse,
      resetLink, // à supprimer quand branchement vrai email
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// POST /users/reset_password/:token
router.post("/reset_password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ result: false, error: "Missing fields" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ result: false, error: "Password too short" });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ result: false, error: "Invalid or expired token" });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    // Déconnecter partout => on supprime le cookie
    res.clearCookie("access_token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    return res.status(200).json({ result: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
