const Request = require('../models/request');
const Incident = require('../models/incident');
const User = require('../models/user');
const Assignment = require('../models/assignment');

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
    req.flash('success', 'Successfully submitted request!');
    res.redirect(`/requests/${newReq._id}`);
};

module.exports.showRequest = async (req, res) => {
    const request = await Request.findById(req.params.id).populate('requestedBy').populate('linkedIncident');
    if (!request) {
        req.flash('error', 'Cannot find that request!');
        return res.redirect('/requests');
    }
    const volunteers = await User.find({ role: 'volunteer' }).select('username');
    res.render('requests/show', { request, volunteers });
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
