const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShelterSchema = new Schema({
    name: { type: String, required: true },
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
    totalCapacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['open', 'full', 'closed'],
        default: 'open'
    },
    managedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

ShelterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shelter', ShelterSchema);
