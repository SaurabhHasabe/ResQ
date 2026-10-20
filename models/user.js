const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose').default;
const { isValidIndianMobile } = require('../utils/phone');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254
    },
    phone: {
        type: String,
        required: false,
        default: '',
        validate: {
            validator: function (v) {
                if (!v) return true;
                return isValidIndianMobile(v);
            },
            message: 'Enter a valid 10-digit Indian mobile number'
        }
    },
    role: {
        type: String,
        enum: ['citizen', 'volunteer', 'admin'],
        default: 'citizen'
    },
    volunteerStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    lastLocation: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    lastLocatedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

UserSchema.index({ lastLocation: '2dsphere' });

UserSchema.pre('save', function () {
    const loc = this.lastLocation;
    const coords = loc && loc.coordinates;
    const valid = Array.isArray(coords) && coords.length === 2
        && Number.isFinite(Number(coords[0])) && Number.isFinite(Number(coords[1]));
    if (!valid) {
        this.lastLocation = undefined;
    }
});

UserSchema.plugin(passportLocalMongoose, {
    usernameLowerCase: true,
    limitAttempts: true,
    maxAttempts: 8,
    errorMessages: {
        UserExistsError: 'A user with that username already exists.',
        TooManyAttemptsError: 'Account temporarily locked due to too many failed logins.'
    }
});

module.exports = mongoose.model('User', UserSchema);
