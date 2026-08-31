const Request = require('../models/request');
const Incident = require('../models/incident');
const User = require('../models/user');

module.exports.index = async (req, res) => {
    const requests = await Request.find({}).populate('requestedBy').populate('linkedIncident');
    res.render('requests/index', { requests });
};

module.exports.renderNewForm = async (req, res) => {
    // Pass verified incidents for optional linking
    const incidents = await Incident.find({ status: 'verified' });
    res.render('requests/new', { incidents, preSelectedId: req.query.incidentId || null });
};

module.exports.createRequest = async (req, res) => {
    const geoData = {
        type: 'Point',
        coordinates: [req.body.request.longitude, req.body.request.latitude]
    };
    const newReq = new Request(req.body.request);
    newReq.location = geoData;
    newReq.requestedBy = req.user._id;
    if (!newReq.linkedIncident) {
        newReq.linkedIncident = null;
    }
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
    const volunteers = await User.find({ role: 'volunteer' });
    res.render('requests/show', { request, volunteers });
};

const Assignment = require('../models/assignment');

module.exports.deleteRequest = async (req, res) => {
    const { id } = req.params;
    await Request.findByIdAndDelete(id);
    await Assignment.deleteMany({ targetId: id, targetType: 'request' });
    req.flash('success', 'Successfully deleted request');
    res.redirect('/requests');
};
