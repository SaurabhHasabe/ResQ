const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
    type: {
        type: String,
        enum: ['rescue', 'medical', 'food', 'water', 'shelter', 'other'],
        required: true
    },
    description: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    address: { type: String, required: true },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'resolved'],
        default: 'open'
    },
    requestedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    linkedIncident: {
        type: Schema.Types.ObjectId,
        ref: 'Incident',
        default: null
    }
}, { timestamps: true });

RequestSchema.index({ status: 1 });
RequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', RequestSchema);
