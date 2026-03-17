const mongoose = require('mongoose');

const changeRequestSchema = mongoose.Schema({
    lessonId: mongoose.Types.ObjectId,
    studentId: mongoose.Types.ObjectId,
    type: {
        type: String,
        enum: ['reschedule', 'cancel']
    },
    message: String,
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected' ]
    },
    createdAt: Date,
    acceptedAt: Date,
});

const ChangeRequest = mongoose.model('changeRequests', changeRequestSchema);

module.exports = ChangeRequest;