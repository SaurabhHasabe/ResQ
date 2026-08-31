const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShelterSchema = new Schema({
    name: { type: String, required: true, minlength: 2, maxlength: 120, trim: true },
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
    totalCapacity: { type: Number, required: true, min: 1, max: 100000 },
    currentOccupancy: { type: Number, default: 0, min: 0, max: 100000 },
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

ShelterSchema.pre('validate', function () {
    if (this.currentOccupancy > this.totalCapacity) {
        this.invalidate('currentOccupancy', 'Current occupancy cannot exceed total capacity');
    }
    if (this.status === 'open' && this.currentOccupancy >= this.totalCapacity) {
        this.status = 'full';
    }
});

module.exports = mongoose.model('Shelter', ShelterSchema);
