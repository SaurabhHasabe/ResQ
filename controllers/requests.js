const Request = require('../models/request');
const Incident = require('../models/incident');
const User = require('../models/user');
const Assignment = require('../models/assignment');
const geo = require('../utils/geo');
const { notifyAdmins, notifyMany, notifyUser } = require('../utils/notify');
const { audit } = require('../utils/audit');

function pointFromBody(request) {
    return {
        type: 'Point',
        coordinates: [Number(request.longitude), Number(request.latitude)]
    };
}

module.exports.index = async (req, res) => {
    const requests = await Request.find({}).populate('requestedBy').populate('linkedIncident');
    res.render('requests/index', { requests });
};

module.exports.renderNewForm = async (req, res) => {
    const incidents = await Incident.find({ status: 'verified' });
    res.render('requests/new', { incidents, preSelectedId: req.query.incidentId || null });
};

module.exports.createRequest = async (req, res) => {
    const { type, urgency, description, address, linkedIncident } = req.body.request;
    let linked = linkedIncident || null;
    if (linked) {
        const incident = await Incident.findById(linked);
        if (!incident || incident.status !== 'verified') {
            req.flash('error', 'You can only link a verified incident.');
            return res.redirect('/requests/new');
        }
    } else {
        linked = null;
    }
    const newReq = new Request({
        type,
        urgency,
        description,
        address,
        linkedIncident: linked,
        location: pointFromBody(req.body.request),
        requestedBy: req.user._id
    });
    await newReq.save();
    const nearest = await geo.nearestVolunteers(newReq.location);
    await notifyAdmins({
        title: 'New aid request',
        body: `${newReq.type} (${newReq.urgency}) at ${newReq.address}`,
        href: `/requests/${newReq._id}`,
        kind: 'request'
    });
    await notifyMany(nearest, {
        title: 'Nearby aid request',
        body: `${newReq.type} — ${newReq.urgency} urgency. You are among the nearest volunteers.`,
        href: `/requests/${newReq._id}`,
        kind: 'request'
    });
    await audit({
        actor: req.user._id,
        action: 'request.created',
        targetType: 'request',
        targetId: newReq._id,
        summary: `${req.user.username} requested ${newReq.type} aid`
    });
    req.flash('success', 'Aid request submitted. Nearby volunteers have been alerted.');
    res.redirect(`/requests/${newReq._id}`);
};

module.exports.showRequest = async (req, res) => {
    const request = await Request.findById(req.params.id).populate('requestedBy').populate('linkedIncident');
    if (!request) {
        req.flash('error', 'Cannot find that request!');
        return res.redirect('/requests');
    }
    const volunteers = await User.find({ role: 'volunteer' }).select('username');
    const canClaim = req.user && request.status === 'open'
        ? await geo.isNearestReviewer(req.user, request.location)
        : false;
    const nearestReviewers = request.status === 'open'
        ? await geo.nearestVolunteers(request.location)
        : [];
    const nearbyShelters = await geo.nearestOpenShelters(request.location);
    res.render('requests/show', {
        request,
        volunteers,
        canClaim,
        nearestReviewers,
        nearbyShelters
    });
};

module.exports.claim = async (req, res) => {
    const request = req.aidRequest || await Request.findById(req.params.id);
    if (!request || request.status !== 'open') {
        req.flash('error', 'This aid request is no longer open.');
        return res.redirect('/assignments');
    }

    const duplicate = await Assignment.findOne({
        volunteer: req.user._id,
        targetType: 'request',
        targetId: request._id,
        status: { $ne: 'resolved' }
    });
    if (duplicate) {
        req.flash('error', 'You are already assigned to this request.');
        return res.redirect('/assignments');
    }

    await Assignment.create({
        volunteer: req.user._id,
        targetType: 'request',
        targetId: request._id,
        assignedBy: req.user._id,
        status: 'assigned'
    });
    request.status = 'assigned';
    await request.save();
    if (request.requestedBy) {
        await notifyUser(request.requestedBy, {
            title: 'A volunteer accepted your aid request',
            body: `${req.user.username} is responding to your ${request.type} request.`,
            href: `/requests/${request._id}`,
            kind: 'request'
        });
    }
    await audit({
        actor: req.user._id,
        action: 'request.claimed',
        targetType: 'request',
        targetId: request._id,
        summary: `${req.user.username} claimed a ${request.type} request`
    });
    req.flash('success', 'You accepted this aid request. It is now on your assignment list.');
    res.redirect('/assignments');
};

module.exports.deleteRequest = async (req, res) => {
    const { id } = req.params;
    const request = await Request.findByIdAndDelete(id);
    if (!request) {
        req.flash('error', 'Cannot find that request!');
        return res.redirect('/requests');
    }
    await Assignment.deleteMany({ targetId: id, targetType: 'request' });
    req.flash('success', 'Successfully deleted request');
    res.redirect('/requests');
};
