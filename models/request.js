const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
    type: {
        type: String,
        enum: ['rescue', 'medical', 'food', 'water', 'shelter', 'other'],
        required: true
    },
    description: { type: String, required: true, minlength: 10, maxlength: 5000, trim: true },
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
