const Teacher = require("../models/teachers");
const Student = require("../models/students");

async function canUserAccessConversation(user, conversation) {
  if (!user || !conversation) return false;

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: user.userId });
    if (!teacher) return false;
    return String(teacher._id) === String(conversation.teacher);
  }

  if (user.role === "student") {
    const student = await Student.findOne({ user: user.userId });
    if (!student) return false;
    return String(student._id) === String(conversation.student);
  }

  return false;
}

module.exports = canUserAccessConversation;
