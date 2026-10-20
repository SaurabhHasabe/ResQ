const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin, isValidObjectId, validateVerify, validateAssign, validateReview, validateAdminReset } = require('../middleware');
const users = require('../controllers/users');
const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Request = require('../models/request');
const Assignment = require('../models/assignment');
const User = require('../models/user');
const VolunteerApplication = require('../models/volunteerApplication');
const shelterCtrl = require('../controllers/shelters');
const incidentsCtrl = require('../controllers/incidents');
const { calculateScore } = require('../utils/priority');
const geo = require('../utils/geo');
const { canReviewIncident } = require('../middleware');
const { notifyUser } = require('../utils/notify');
const { audit } = require('../utils/audit');
const AuditLog = require('../models/auditLog');
const ops = require('../controllers/ops');

router.get('/dashboard', isLoggedIn, isAdmin, catchAsync(async (req, res) => {
    const pendingIncidentsDocs = await Incident.find({ status: 'pending' });
    const pendingIncidents = pendingIncidentsDocs.map(doc => doc.toObject());

    for (const inc of pendingIncidents) {
        inc.suggestedScore = calculateScore(inc, pendingIncidents);
        inc.nearestReviewers = await geo.nearestVolunteers(inc.location);
    }
    pendingIncidents.sort((a, b) => b.suggestedScore - a.suggestedScore);

    const verifiedIncidents = await Incident.countDocuments({ status: 'verified' });
    const openRequests = await Request.countDocuments({ status: 'open' });

    const shelters = await Shelter.find({ verificationStatus: 'approved' });
    let totalCapacity = 0;
    let totalOccupancy = 0;
    shelters.forEach(s => {
        totalCapacity += s.totalCapacity;
        totalOccupancy += s.currentOccupancy;
    });

    const unassignedTasks = openRequests + pendingIncidentsDocs.length;
    const volunteers = await User.find({ role: 'volunteer' }).select('username volunteerStatus');
    const pendingApplications = await VolunteerApplication.find({ status: 'pending' })
        .populate('applicant', 'username email phone')
        .sort({ createdAt: 1 });
    const pendingShelters = await Shelter.find({ verificationStatus: 'pending' })
        .populate('managedBy', 'username phone')
        .sort({ createdAt: 1 });

    const volunteerIds = volunteers.map(v => v._id);
    const volunteerAssignments = await Assignment.find({ volunteer: { $in: volunteerIds } });
    const volunteerPerformance = volunteers.map(v => {
        const mine = volunteerAssignments.filter(a => a.volunteer.equals(v._id));
        return {
            _id: v._id,
            username: v.username,
            total: mine.length,
            resolved: mine.filter(a => a.status === 'resolved').length,
            active: mine.filter(a => a.status !== 'resolved').length,
            lastUpdate: mine.reduce((latest, a) => {
                const t = a.updatedAt || a.createdAt;
                return !latest || t > latest ? t : latest;
            }, null)
        };
    }).sort((a, b) => b.resolved - a.resolved || b.active - a.active);

    const recentAudit = await AuditLog.find({}).populate('actor', 'username').sort({ createdAt: -1 }).limit(12);

    res.render('dashboard/admin', {
        pendingIncidents,
        verifiedIncidents,
        openRequests,
        totalCapacity,
        totalOccupancy,
        unassignedTasks,
        volunteers,
        pendingApplications,
        pendingShelters,
        volunteerPerformance,
        recentAudit
    });
}));

router.get('/audit', isLoggedIn, isAdmin, catchAsync(ops.audit));

router.post('/users/reset-password', isLoggedIn, isAdmin, validateAdminReset, catchAsync(users.adminIssuePassword));

router.post(
    '/shelters/:id/review',
    isLoggedIn,
    isAdmin,
    isValidObjectId,
    validateReview,
    catchAsync(shelterCtrl.review)
);

router.post(
    '/incidents/:id/verify',
    isLoggedIn,
    isAdmin,
    isValidObjectId,
    canReviewIncident,
    validateVerify,
    catchAsync(incidentsCtrl.review)
);

router.post('/assign', isLoggedIn, isAdmin, validateAssign, catchAsync(async (req, res) => {
    const { volunteerId, targetType, targetId } = req.body;
    const referer = req.get('Referrer') || req.get('Referer') || '/admin/dashboard';

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
        req.flash('error', 'Select a valid volunteer.');
        return res.redirect(referer);
    }

    const Target = targetType === 'incident' ? Incident : Request;
    const target = await Target.findById(targetId);
    if (!target) {
        req.flash('error', 'Target not found.');
        return res.redirect(referer);
    }

    const duplicate = await Assignment.findOne({
        volunteer: volunteerId,
        targetType,
        targetId,
        status: { $ne: 'resolved' }
    });
    if (duplicate) {
        req.flash('error', 'That volunteer is already assigned to this task.');
        return res.redirect(referer);
    }

    const assignment = new Assignment({
        volunteer: volunteerId,
        targetType,
        targetId,
        assignedBy: req.user._id
    });
    await assignment.save();

    if (targetType === 'request' && target.status === 'open') {
        target.status = 'assigned';
        await target.save();
    }

    await notifyUser(volunteer, {
        title: 'New field assignment',
        body: `You were assigned a ${targetType}. Open Assignments to update status.`,
        href: '/assignments',
        kind: 'assignment'
    });
    await audit({
        actor: req.user._id,
        action: 'assignment.created',
        targetType,
        targetId: target._id,
        summary: `${req.user.username} assigned ${volunteer.username} to a ${targetType}`
    });

    req.flash('success', 'Successfully assigned task to volunteer');
    res.redirect(referer);
}));

module.exports = router;
