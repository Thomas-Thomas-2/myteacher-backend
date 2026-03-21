const express = require("express");
const Ressource = require("../models/ressources");
const Student = require("../models/students");
const authMiddleware = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { checkBody } = require("../modules/checkBody");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const mongoose = require("mongoose");

// Get all ressources of a teacher
router.get(
  "/getRessources",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    const teacherId = req.user.userId;
    try {
      const ressources = await Ressource.find({ teacherId });
      res.json({ result: true, ressources });
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error fetching ressources" });
    }
  },
);

// Add a ressource
router.post(
  "/add",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    try {
      const filePath = `./tmp/${Date.now()}_${req.files.file.name}`;
      const resultMove = await req.files.file.mv(filePath);
      const resultCloudinary = await cloudinary.uploader.upload(filePath);

      fs.unlinkSync(filePath);

      const teacherId = req.user.userId;
      const { title, tag } = req.body;
      const url = resultCloudinary.secure_url;

      const newRessource = await Ressource.create({
        teacherId,
        title,
        type: "file",
        url,
        tags: tag,
      });

      res.json({ result: true, newRessource });
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error creating ressource" });
    }
  },
);

// Share a ressource
router.post(
  "/share",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    try {
      if (!checkBody(req.body, ["ressources", "students"])) {
        res
          .status(400)
          .json({ result: false, error: "Missing fields for sharing" });
        return;
      }
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error with inputs for sharing" });
    }

    const { ressources, students } = req.body;

    try {
      for (let obj of ressources) {
        let ressourceCheck = await Ressource.findById(obj._id);
        if (!ressourceCheck) {
          res.status(404).json({ result: false, error: "Ressource not found" });
          return;
        } else {
          let studentIdTable = ressourceCheck.studentId;
          !studentIdTable.some((id) => id.toString() === students[0]) &&
            studentIdTable.push(students[0]);
          const updateRessource = await Ressource.updateOne(
            { _id: obj._id },
            { studentId: studentIdTable },
          );
        }
      }
      res.json({ result: true, message: "Sharing done" });
    } catch (error) {
      console.log("Error", error);
      res.status(500).json({ result: false, error: "Error for sharing" });
    }
  },
);

// Delete a ressource
router.delete(
  "/deleteRessource/:id",
  authMiddleware,
  requireRole("teacher"),
  async (req, res) => {
    try {
      const deletedRessource = await Ressource.findByIdAndDelete(req.params.id);
      if (deletedRessource) {
        res.json({ result: true });
      } else {
        res.json({ result: false, error: "Ressource not found" });
      }
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error deleting ressource" });
    }
  },
);

// Get all ressources of a student
router.get(
  "/getRessourcesStudent",
  authMiddleware,
  requireRole("student"),
  async (req, res) => {
    try {
      const student = await Student.findOne({ user: req.user.userId });

      if (!student) {
        return res
          .status(404)
          .json({ result: false, error: "Student not found" });
      }

      const ressources = await Ressource.find({
        studentId: new mongoose.Types.ObjectId(student._id),
      });
      res.json({ result: true, ressources });
    } catch (error) {
      console.log("Error", error);
      res
        .status(500)
        .json({ result: false, error: "Error fetching ressources" });
    }
  },
);

module.exports = router;
