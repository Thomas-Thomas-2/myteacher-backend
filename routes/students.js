var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Student = require("../models/students");
const Teacher = require("../models/teachers");
const Invitation = require("../models/invitations");
const { checkBody } = require("../modules/checkBody");
const authMiddleware = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/* GET teachers students. */
router.get(
  "/getStudents",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      const teacher = await Teacher.findOne({ user: req.user.userId });
      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher profile not found" });
      }

      let students = [];

      const data = await Student.find({ teacher: teacher._id }).populate(
        "user",
      );

      if (data.length > 0) {
        const invitations = await Invitation.find({ teacher: teacher._id });

        for (let obj of data) {
          const firstName = obj.user?.firstName || obj.firstName || "";
          const lastName = obj.user?.lastName || obj.lastName || "";
          const email = obj.user?.email || obj.email || "";

          const hasInvite =
            invitations.find((element) => element.email === email) != undefined;

          // bouton inviter seulement pour un prospect sans invitation active
          const invite = obj.status === "Prospect" && !hasInvite;

          students.push({
            id: obj._id,
            firstName,
            lastName,
            email,
            phone: obj.phone,
            discipline: obj.discipline,
            status: obj.status,
            structure: obj.structure,
            subscription: obj.subscription,
            invite,
          });
        }

        return res.json({ result: true, students });
      } else {
        // quand plus de data mockées => result: true, students: []
        //return res.json({ result: false, error: "No student found" });
        return res.json({ result: true, students: [] });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

/* POST addStudent */
router.post(
  "/addStudent",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      if (!checkBody(req.body, ["firstName", "lastName", "email"])) {
        return res.json({ result: false, error: "Missing data" });
      }

      const firstName = req.body.firstName.trim();
      const lastName = req.body.lastName.trim();
      const email = req.body.email.toLowerCase().trim();

      // récupérer le vrai profile teacher
      const teacher = await Teacher.findOne({ user: req.user.userId });
      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher profile not found" });
      }

      // Vérifier si un vrai compte user existe déjà avec cet email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({
          result: false,
          error: "Un utilisateur avec cet email existe déjà",
        });
      }

      // Vérifier si un prospect/student existe déjà pour ce prof avec cet email
      const existingStudent = await Student.findOne({
        teacher: teacher._id,
        email,
      });

      if (existingStudent) {
        return res.status(409).json({
          result: false,
          error: "Un élève/prospect avec cet email existe déjà",
        });
      }

      const newStudent = await Student.create({
        teacher: teacher._id,
        firstName,
        lastName,
        email,
        status: "Prospect",
        subscription: null,
      });

      return res.status(201).json({
        result: true,
        student: {
          id: newStudent._id,
          firstName: newStudent.firstName,
          lastName: newStudent.lastName,
          email: newStudent.email,
          phone: newStudent.phone,
          discipline: newStudent.discipline,
          status: newStudent.status,
          structure: newStudent.structure,
          subscription: newStudent.subscription,
          invite: true,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

/* PUT updateIdentity */
router.put(
  "/updateIdentity",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      if (!checkBody(req.body, ["studentId"])) {
        return res.json({ result: false, error: "Missing studentId" });
      }

      const teacher = await Teacher.findOne({ user: req.user.userId });

      if (!teacher) {
        return res.json({ result: false, error: "Teacher not found" });
      }

      const student = await Student.findOne({
        _id: req.body.studentId,
        teacher: teacher._id,
      }).populate("user");

      if (!student) {
        return res.json({ result: false, error: "Student not found" });
      }

      if (typeof req.body.phone === "string") {
        student.phone = req.body.phone.trim();
      }

      if (typeof req.body.firstName === "string") {
        student.firstName = req.body.firstName.trim();
      }

      if (typeof req.body.lastName === "string") {
        student.lastName = req.body.lastName.trim();
      }

      if (typeof req.body.email === "string") {
        student.email = req.body.email.toLowerCase().trim();
      }

      if (typeof req.body.structure === "string") {
        student.structure = req.body.structure.trim();
      }

      if (typeof req.body.discipline === "string") {
        student.discipline = req.body.discipline.trim();
      }

      await student.save();

      if (student.user) {
        if (typeof req.body.firstName === "string") {
          student.user.firstName = req.body.firstName.trim();
        }

        if (typeof req.body.lastName === "string") {
          student.user.lastName = req.body.lastName.trim();
        }

        if (typeof req.body.email === "string") {
          student.user.email = req.body.email.toLowerCase().trim();
        }

        await student.user.save();
      }

      res.json({ result: true });
    } catch (error) {
      console.log(error);
      res.json({ result: false, error: "Server error" });
    }
  },
);

// GET /students/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const student = await Student.findOne({ user: userId }).populate("teacher");
    if (!student) {
      return res
        .status(404)
        .json({ result: false, error: "Student not found" });
    }

    return res.status(200).json({
      result: true,
      student: {
        id: student._id,
        avatarUrl: student.avatarUrl || "",
        phone: student.phone || "",
        discipline: student.discipline || "",
        structure: student.structure || "",
        subscription: student.subscription || "",
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// PUT /students/me
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { firstName, lastName, phone, avatarUrl } = req.body;

    const user = await User.findById(userId);
    const student = await Student.findOne({ user: userId });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    if (!student) {
      return res
        .status(404)
        .json({ result: false, error: "Student not found" });
    }

    // Partie User
    if (typeof firstName === "string") user.firstName = firstName.trim();
    if (typeof lastName === "string") user.lastName = lastName.trim();

    // Partie Student
    if (typeof phone === "string") student.phone = phone.trim();
    if (typeof avatarUrl === "string") student.avatarUrl = avatarUrl.trim();

    await user.save();
    await student.save();

    return res.status(200).json({
      result: true,
      profile: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatarUrl: student.avatarUrl || "",
        phone: student.phone || "",
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

router.put(
  "/changeStatus",
  authMiddleware,
  requireRole("teacher"),
  function (req, res) {
    try {
      if (!checkBody(req.body, ["id", "status"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
      }

      Student.findOneAndUpdate(
        { _id: req.body.id },
        { status: req.body.status },
        {
          //(filter, target, option)
          returnDocument: "after",
        },
      ).then((data) => {
        if (data) {
          res.status(200).json({ result: true, student: data });
        } else {
          return res
            .status(404)
            .json({ result: false, error: "Student not found" });
        }
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

/* PUT updateSubscription */
router.put(
  "/updateSubscription",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      if (!checkBody(req.body, ["studentId"])) {
        return res.json({ result: false, error: "Missing studentId" });
      }

      const teacher = await Teacher.findOne({ user: req.user.userId });

      if (!teacher) {
        return res.json({ result: false, error: "Teacher not found" });
      }

      const student = await Student.findOne({
        _id: req.body.studentId,
        teacher: teacher._id,
      });

      if (!student) {
        return res.json({ result: false, error: "Student not found" });
      }

      if (!student.subscription) {
        student.subscription = {};
      }

      if (typeof req.body.type === "string") {
        student.subscription.type = req.body.type.trim();
      }

      if (typeof req.body.price === "number" && !Number.isNaN(req.body.price)) {
        student.subscription.price = req.body.price;
      }

      if (typeof req.body.modalite === "string") {
        student.subscription.modalite = req.body.modalite.trim();
      }

      await student.save();

      return res.json({ result: true });
    } catch (error) {
      console.log(error);
      return res.json({ result: false, error: "Server error" });
    }
  },
);

module.exports = router;
