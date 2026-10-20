const AuditLog = require('../models/auditLog');

async function audit({ actor, action, targetType = '', targetId = null, summary, meta = {} }) {
    try {
        await AuditLog.create({
            actor: actor || null,
            action,
            targetType,
            targetId,
            summary,
            meta
        });
    } catch (err) {
        console.error('Audit log failed:', err.message);
    }
}

module.exports = { audit };
