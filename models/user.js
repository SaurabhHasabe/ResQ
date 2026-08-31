const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let passportLocalMongoose = require('passport-local-mongoose');

// Handle both commonjs and esm default export structures
if (passportLocalMongoose.default && typeof passportLocalMongoose.default === 'function') {
    passportLocalMongoose = passportLocalMongoose.default;
} else if (passportLocalMongoose && typeof passportLocalMongoose !== 'function') {
    if(typeof passportLocalMongoose === 'object') {
         passportLocalMongoose = passportLocalMongoose.passportLocalMongoose || passportLocalMongoose;
    }
}

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ['citizen', 'volunteer', 'admin'],
        default: 'citizen'
    }
}, { timestamps: true });

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
