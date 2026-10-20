const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SKILLS = ['medical', 'rescue', 'driving', 'logistics', 'counseling', 'translation', 'other'];

const VolunteerApplicationSchema = new Schema({
    applicant: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skills: {
        type: [{ type: String, enum: SKILLS }],
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'Select at least one skill'
        }
    },
    availability: {
        type: String,
        enum: ['weekdays', 'weekends', 'anytime', 'on-call'],
        required: true
    },
    experience: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 2000,
        trim: true
    },
    message: {
        type: String,
        default: '',
        maxlength: 1000,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        default: '',
        maxlength: 500
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: { type: Date, default: null }
}, { timestamps: true });

VolunteerApplicationSchema.index({ applicant: 1, status: 1 });
VolunteerApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('VolunteerApplication', VolunteerApplicationSchema);
