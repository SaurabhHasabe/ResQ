const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema({
    volunteer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['incident', 'request'],
        required: true
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        // Using refPath allows dynamic referencing for Mongoose populate
        refPath: 'targetType'
    },
    status: {
        type: String,
        enum: ['assigned', 'en_route', 'in_progress', 'resolved'],
        default: 'assigned'
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fieldNotes: {
        type: String,
        default: '',
        maxlength: 2000
    }
}, { timestamps: true });

AssignmentSchema.index({ volunteer: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
