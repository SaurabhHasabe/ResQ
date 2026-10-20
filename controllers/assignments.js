const Assignment = require('../models/assignment');
const Incident = require('../models/incident');
const Request = require('../models/request');
const geo = require('../utils/geo');
const { notifyAdmins } = require('../utils/notify');
const { audit } = require('../utils/audit');

async function populateTargets(assignments) {
    await Promise.all(assignments.map(async (a) => {
        const Model = a.targetType === 'incident' ? Incident : Request;
        a.targetId = await Model.findById(a.targetId);
    }));
}

module.exports.index = async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { volunteer: req.user._id };
    const assignments = await Assignment.find(filter).populate('volunteer').sort({ updatedAt: -1 });
    await populateTargets(assignments);

    let nearbyIncidents = [];
    let nearbyRequests = [];
    const hasLocation = geo.isValidPoint(req.user.lastLocation);
    if (req.user.role === 'volunteer' && hasLocation) {
        const pending = await geo.nearbyPendingIncidents(req.user);
        const openReqs = await geo.nearbyOpenRequests(req.user);
        const from = req.user.lastLocation.coordinates;
        const reviewable = [];
        for (const inc of pending) {
            if (await geo.isNearestReviewer(req.user, inc.location)) reviewable.push(inc);
        }
        const claimable = [];
        for (const reqDoc of openReqs) {
            if (await geo.isNearestReviewer(req.user, reqDoc.location)) claimable.push(reqDoc);
        }
        nearbyIncidents = geo.withDistance(reviewable, from);
        nearbyRequests = geo.withDistance(claimable, from);
    }

    res.render('assignments/index', {
        assignments,
        nearbyIncidents,
        nearbyRequests,
        hasLocation
    });
};

function sameUser(a, b) {
    return String(a && a._id ? a._id : a) === String(b && b._id ? b._id : b);
}

module.exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, fieldNotes } = req.body;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
        req.flash('error', 'Assignment not found.');
        return res.redirect('/assignments');
    }

    if (req.user.role !== 'admin' && !sameUser(assignment.volunteer, req.user._id)) {
        req.flash('error', 'Not permitted.');
        return res.redirect('/assignments');
    }

    if (assignment.status === 'resolved') {
        req.flash('error', 'This assignment is already resolved and cannot be updated.');
        return res.redirect('/assignments');
    }

    assignment.status = status;
    if (typeof fieldNotes === 'string') {
        assignment.fieldNotes = fieldNotes;
    }
    await assignment.save();

    if (status === 'resolved') {
        try {
            const Model = assignment.targetType === 'incident' ? Incident : Request;
            const target = await Model.findById(assignment.targetId);
            if (target && target.status !== 'resolved' && target.schema.path('status').enumValues.includes('resolved')) {
                target.status = 'resolved';
                await target.save();
            }
        } catch (err) {
            console.error('Failed to mark target resolved:', err.message);
        }
    }

    await audit({
        actor: req.user._id,
        action: 'assignment.updated',
        targetType: 'assignment',
        targetId: assignment._id,
        summary: `${req.user.username} set assignment to ${status}`
    });
    if (status === 'resolved') {
        await notifyAdmins({
            title: 'Assignment resolved',
            body: `${req.user.username} resolved a ${assignment.targetType} task.`,
            href: '/assignments',
            kind: 'assignment'
        });
    }
    req.flash('success', 'Assignment updated.');
    res.redirect('/assignments');
};
