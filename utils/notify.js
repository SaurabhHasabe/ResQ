const Notification = require('../models/notification');
const User = require('../models/user');

async function notifyUser(userOrId, { title, body, href = '/', kind = 'system' }) {
    const userId = userOrId && userOrId._id ? userOrId._id : userOrId;
    if (!userId) return null;
    return Notification.create({
        user: userId,
        title,
        body,
        href,
        kind
    });
}

async function notifyMany(users, payload) {
    const list = (users || []).filter(Boolean);
    await Promise.all(list.map((u) => notifyUser(u, payload)));
}

async function notifyAdmins(payload) {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await notifyMany(admins, payload);
}

async function unreadCount(userId) {
    if (!userId) return 0;
    return Notification.countDocuments({ user: userId, readAt: null });
}

module.exports = { notifyUser, notifyMany, notifyAdmins, unreadCount };
