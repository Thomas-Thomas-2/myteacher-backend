var express = require("express");
var router = express.Router();

require("../models/connection");

const Lesson = require("../models/lessons");
const Teacher = require("../models/teachers");
const Student = require("../models/students");
const Invoice = require("../models/invoices");
const User = require("../models/users");
const generateInvoicePdfBuffer = require("../services/generateInvoicePdf");
const uploadPdfToCloudinary = require("../services/uploadPdfToCloudinary");
const authMiddleware = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

// GET /lessons/getLessons
// Récupérer les cours du teacher connecté
router.get(
  "/getLessons",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      const teacher = await Teacher.findOne({ user: req.user.userId });

      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher not found" });
      }

      const data = await Lesson.find({ teacher: teacher._id })
        .populate("student")
        .sort({
          startAt: 1,
        });

      const lessons = data.map((obj) => ({
        id: obj._id,
        student: obj.student[0],
        title: obj.title,
        startAt: obj.startAt,
        endAt: obj.endAt,
        desc: obj.teacherNotes,
        structure: obj.structure,
        location: obj.locationType,
      }));

      return res.json({ result: true, lessons });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

// POST /lessons/addEvent
// Créer un cours + créer automatiquement une facture
router.post(
  "/addEvent",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      const { title, desc, start, end, structure, location, student } =
        req.body;

      if (!student || !title || !start || !end) {
        return res.status(400).json({ result: false, error: "Missing fields" });
      }

      const teacher = await Teacher.findOne({ user: req.user.userId });
      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher not found" });
      }

      const studentDoc = await Student.findOne({
        _id: student,
        teacher: teacher._id,
      }).populate("user");

      if (!studentDoc) {
        return res
          .status(404)
          .json({ result: false, error: "Student not found" });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      const newLesson = new Lesson({
        teacher: teacher._id,
        student: [studentDoc._id],
        title,
        startAt: startDate,
        endAt: endDate,
        structure,
        teacherNotes: desc,
        locationType: location,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newLesson.save();

      const lessonPrice = studentDoc.subscription?.price || 30;
      const invoiceNumber = `MT-${new Date().getFullYear()}-${Date.now()}`;

      const newInvoice = new Invoice({
        teacher: teacher._id,
        student: studentDoc._id,
        lesson: newLesson._id,
        invoiceNumber,
        period: startDate.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        }),
        label: title || "Cours",
        amount: lessonPrice,
        status: endDate <= new Date() ? "pending" : "scheduled",
        dueAt: endDate,
        provider: "manual",
        paymentMethod: "cash",
      });

      await newInvoice.save();

      try {
        const teacherUser = await User.findById(req.user.userId);

        const pdfBuffer = await generateInvoicePdfBuffer({
          invoiceNumber: newInvoice.invoiceNumber,
          teacherName: teacherUser
            ? `${teacherUser.firstName || ""} ${teacherUser.lastName || ""}`.trim()
            : "Professeur",
          studentName: `${
            studentDoc.user?.firstName || studentDoc.firstName || ""
          } ${studentDoc.user?.lastName || studentDoc.lastName || ""}`.trim(),
          discipline: studentDoc.discipline || "",
          label: newInvoice.label,
          amount: newInvoice.amount,
          dueAt: newInvoice.dueAt,
          period: newInvoice.period,
          status: newInvoice.status,
        });

        const uploadResult = await uploadPdfToCloudinary(
          pdfBuffer,
          newInvoice.invoiceNumber,
        );

        console.log("Cloudinary PDF upload result:", uploadResult);

        newInvoice.pdfURL = uploadResult.secure_url || uploadResult.url || "";
        await newInvoice.save();
      } catch (pdfError) {
        console.error("PDF generation/upload error:", pdfError);
      }

      const savedInvoice = await Invoice.findById(newInvoice._id);

      // SAUVEGARDE AU CAS OU - 12/03/2026 9:45
      // return res.json({
      //   result: true,
      //   lesson: {
      //     id: newLesson._id,
      //     title: newLesson.title,
      //     startAt: newLesson.startAt,
      //     endAt: newLesson.endAt,
      //     student: studentDoc._id,
      //     structure: newLesson.structure,
      //     lieu: newLesson.locationType,
      //     desc: newLesson.teacherNotes,
      //   },
      //   invoice: newInvoice,
      // });

      // MODIF 9:50  12/03/26 pour corriger affichage front
      return res.json({
        result: true,
        lesson: {
          id: newLesson._id,
          title: newLesson.title,
          startAt: newLesson.startAt,
          endAt: newLesson.endAt,
          student: studentDoc,
          structure: newLesson.structure,
          location: newLesson.locationType,
          desc: newLesson.teacherNotes,
        },
        invoice: savedInvoice,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

// DELETE /lessons/removeEvent/:id
router.delete(
  "/removeEvent/:id",
  authMiddleware,
  requireRole("teacher"),
  async function (req, res) {
    try {
      const teacher = await Teacher.findOne({ user: req.user.userId });

      if (!teacher) {
        return res
          .status(404)
          .json({ result: false, error: "Teacher not found" });
      }

      const lesson = await Lesson.findOne({
        _id: req.params.id,
        teacher: teacher._id,
      });

      if (!lesson) {
        return res
          .status(404)
          .json({ result: false, error: "Lesson not found" });
      }

      // empêcher suppression si le cours est déjà passé
      if (lesson.startAt <= new Date()) {
        return res.status(400).json({
          result: false,
          error: "Impossible de supprimer un cours déjà passé",
        });
      }

      // vérifier s'il existe des factures liées à ce cours
      const invoices = await Invoice.find({
        lesson: lesson._id,
        teacher: teacher._id,
      });

      // si au moins une facture est payée -> on bloque
      const hasPaidInvoice = invoices.some((inv) => inv.status === "paid");

      if (hasPaidInvoice) {
        return res.status(400).json({
          result: false,
          error:
            "Impossible de supprimer ce cours car une facture est déjà payée",
        });
      }

      // supprimer toutes les factures liées au cours
      if (invoices.length > 0) {
        await Invoice.deleteMany({
          lesson: lesson._id,
          teacher: teacher._id,
        });
      }

      // supprimer le cours
      await Lesson.deleteOne({ _id: lesson._id });

      return res.json({ result: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

// GET /lessons/getLessonsStudent
// Récupérer les cours du student connecté
router.get(
  "/getLessonsStudent",
  authMiddleware,
  requireRole("student"),
  async function (req, res) {
    try {
      const student = await Student.findOne({ user: req.user.userId });

      if (!student) {
        return res
          .status(404)
          .json({ result: false, error: "Student not found" });
      }

      const data = await Lesson.find({ student: student._id }).sort({
        startAt: 1,
      });

      const lessons = data.map((obj) => ({
        id: obj._id,
        title: obj.title,
        start: obj.startAt,
        end: obj.endAt,
        student: student._id,
        structure: obj.structure,
        location: obj.locationType,
        desc: obj.teacherNotes,
      }));

      return res.json({ result: true, lessons });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

// GET /lessons/getLessonsStudentById/:studentId
// Optionnel : récupérer les cours d'un étudiant par son id
router.get(
  "/getLessonsStudentById/:studentId",
  authMiddleware,
  async function (req, res) {
    try {
      const student = await Student.findById(req.params.studentId);

      if (!student) {
        return res
          .status(404)
          .json({ result: false, error: "Student not found" });
      }

      const data = await Lesson.find({ student: student._id }).sort({
        startAt: 1,
      });

      const lessons = data.map((obj) => ({
        id: obj._id,
        title: obj.title,
        start: obj.startAt,
        end: obj.endAt,
        student: student._id,
        structure: obj.structure,
        location: obj.locationType,
        desc: obj.teacherNotes,
      }));

      return res.json({ result: true, lessons });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ result: false, error: "Server error" });
    }
  },
);

module.exports = router;
