const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

const IncidentSchema = new Schema({
    title: { type: String, required: true, minlength: 3, maxlength: 120, trim: true },
    description: { type: String, required: true, minlength: 10, maxlength: 5000, trim: true },
    category: {
        type: String,
        enum: ['flood', 'fire', 'earthquake', 'building collapse', 'other'],
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length === 2 &&
                    v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90,
                message: 'Coordinates must be [longitude, latitude]'
            }
        }
    },
    address: { type: String, required: true, minlength: 5, maxlength: 300, trim: true },
    selfReportedSeverity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    verifiedSeverity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: null
    },
    priorityScore: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'duplicate', 'resolved'],
        default: 'pending'
    },
    photos: { type: [ImageSchema], default: [] },
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verifiedAt: { type: Date, default: null }
}, { timestamps: true });

IncidentSchema.index({ location: '2dsphere' });
IncidentSchema.index({ status: 1 });

module.exports = mongoose.model('Incident', IncidentSchema);
