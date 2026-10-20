const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Notification = require('../models/notification');
const AuditLog = require('../models/auditLog');
const { opsSnapshot, publicFeed, incidentPopups, shelterPopups } = require('../utils/ops');

module.exports.home = async (req, res) => {
    const stats = await opsSnapshot();
    const incidents = await Incident.find({ status: 'verified' }).sort({ createdAt: -1 }).limit(8);
    const shelters = await Shelter.find({
        verificationStatus: 'approved',
        status: { $in: ['open', 'full'] }
    }).sort({ createdAt: -1 }).limit(6);
    const popups = [...incidentPopups(incidents), ...shelterPopups(shelters)];
    res.render('ops/home', { stats, incidents, shelters, popups });
};

module.exports.feed = async (req, res) => {
    const data = await publicFeed();
    res.json(data);
};

module.exports.health = async (req, res) => {
    const mongoose = require('mongoose');
    const dbOk = mongoose.connection.readyState === 1;
    res.status(dbOk ? 200 : 503).json({
        ok: dbOk,
        service: 'resq',
        db: dbOk ? 'up' : 'down',
        uptime: Math.round(process.uptime())
    });
};

module.exports.notifications = async (req, res) => {
    const notes = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.render('ops/notifications', { notes });
};

module.exports.markRead = async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, readAt: null },
        { $set: { readAt: new Date() } }
    );
    res.redirect('/notifications');
};

module.exports.audit = async (req, res) => {
    const logs = await AuditLog.find({}).populate('actor', 'username role').sort({ createdAt: -1 }).limit(80);
    res.render('ops/audit', { logs });
};
