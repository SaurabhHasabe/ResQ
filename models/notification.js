const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 160, trim: true },
    body: { type: String, required: true, maxlength: 1000, trim: true },
    href: { type: String, default: '/', maxlength: 300 },
    kind: {
        type: String,
        enum: ['incident', 'request', 'assignment', 'volunteer', 'shelter', 'system'],
        default: 'system'
    },
    readAt: { type: Date, default: null }
}, { timestamps: true });

NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
