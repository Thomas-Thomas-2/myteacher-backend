var express = require("express");
var router = express.Router();

require("../models/connection");
const Teacher = require("../models/teachers");
const User = require("../models/users");
const authMiddleware = require("../middlewares/auth");
const { checkBody } = require("../modules/checkBody");
const requireRole = require("../middlewares/requireRole");

/* GET teachers students. */
router.get("/", function (req, res) {
  res.send("respond with a resource");
});

// GET /teachers/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res
        .status(404)
        .json({ result: false, error: "Teacher not found" });
    }

    return res.status(200).json({
      result: true,
      teacher: {
        id: teacher._id,
        user: teacher.user,
        avatarUrl: teacher.avatarUrl || "",
        phone: teacher.phone || "",
        address: teacher.address || "",
        discipline: teacher.discipline || [],
        structures: teacher.structures || [],
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// PUT /teachers/me
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { firstName, lastName, phone, address, avatarUrl, discipline } =
      req.body;

    const user = await User.findById(userId);
    const teacher = await Teacher.findOne({ user: userId });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    if (!teacher) {
      return res
        .status(404)
        .json({ result: false, error: "Teacher not found" });
    }

    // Partie User
    if (typeof firstName === "string") user.firstName = firstName.trim();
    if (typeof lastName === "string") user.lastName = lastName.trim();

    // Partie Teacher
    if (typeof phone === "string") teacher.phone = phone.trim();
    if (typeof address === "string") teacher.address = address.trim();
    if (typeof avatarUrl === "string") teacher.avatarUrl = avatarUrl.trim();
    if (Array.isArray(discipline)) teacher.discipline = discipline;

    await user.save();
    await teacher.save();

    return res.status(200).json({
      result: true,
      profile: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        teacherId: teacher._id,
        avatarUrl: teacher.avatarUrl || "",
        phone: teacher.phone || "",
        address: teacher.address || "",
        discipline: teacher.discipline || [],
        structures: teacher.structures || [],
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});

// Get all structures and disciplines of a teacher
router.get(
  "/getStructures",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    const teacherId = req.user.userId;

    try {
      const teacher = await Teacher.findOne({ user: teacherId });

      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher not found" });
      }

      res.json({
        result: true,
        structures: teacher.structures || [],
        disciplines: teacher.discipline || [],
      });
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error fetching structures" });
    }
  },
);

// Add a structure
router.post(
  "/addStructure",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    try {
      if (!checkBody(req.body, ["name"])) {
        res.json({ result: false, error: "Input data missing" });
        return;
      }
      const teacherId = req.user.userId;
      const teacherModif = await Teacher.findOne({ user: teacherId });

      if (
        !teacherModif.structures.some((stru) => stru.name === req.body.name)
      ) {
        const structureModif = [...teacherModif.structures, req.body];
        await Teacher.updateOne(
          {
            user: teacherId,
          },
          { structures: structureModif },
        );

        res.json({ result: true });
      } else {
        res.json({ result: false, error: "Structure already existing" });
      }
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error creating ressource" });
    }
  },
);

// Delete a structure
router.delete(
  "/deleteStructure/:id",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    try {
      const teacherId = req.user.userId;
      const teacherModif = await Teacher.findOne({ user: teacherId });
      console.log("retour", teacherModif);
      console.log("params", req.params.id);
      if (
        teacherModif.structures.some(
          (stru) => stru._id.toString() === req.params.id,
        )
      ) {
        const structureModif = teacherModif.structures.filter(
          (stru) => stru._id.toString() !== req.params.id,
        );
        await Teacher.updateOne(
          {
            user: teacherId,
          },
          { structures: structureModif },
        );

        res.json({ result: true });
      } else {
        res.json({
          result: false,
          error: "Structure not existing in database",
        });
      }
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error deleting ressource" });
    }
  },
);

module.exports = router;
