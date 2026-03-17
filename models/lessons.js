const mongoose = require('mongoose');

const lessonSchema = mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teachers",
    required: true,
  },
  student: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "students",
    required: true,
  },
  structure: String,
  title: String,
  startAt: Date,
  endAt: Date,
  locationType: String, //Fixed Answer
  locationDetails: String,
  status: String,
  teacherNotes: String,
  createdAt: Date,
  updatedAt: Date,
});

const Lesson = mongoose.model('lessons', lessonSchema);

module.exports = Lesson;