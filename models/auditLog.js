const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuditLogSchema = new Schema({
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, maxlength: 80, index: true },
    targetType: { type: String, default: '', maxlength: 40 },
    targetId: { type: Schema.Types.ObjectId, default: null },
    summary: { type: String, required: true, maxlength: 500 },
    meta: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
