const mongoose = require('mongoose');
const ExpressError = require('./utils/ExpressError');
const { incidentSchema, shelterSchema, requestSchema, userSchema } = require('./schema');
const Incident = require('./models/incident');
const Request = require('./models/request');

module.exports.isValidObjectId = (req, res, next) => {
    if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        req.flash('error', 'Invalid Request ID.');
        return res.redirect('/');
    }
    next();
};

module.exports.validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        req.flash('error', msg);
        return res.redirect('/register');
    }
    next();
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
};

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'You do not have permission to do that.');
        res.redirect('/');
    }
};

module.exports.isVolunteer = (req, res, next) => {
    if (req.user && (req.user.role === 'volunteer' || req.user.role === 'admin')) {
        next();
    } else {
        req.flash('error', 'You do not have permission to do that.');
        res.redirect('/');
    }
};

module.exports.validateIncident = (req, res, next) => {
    const { error } = incidentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

module.exports.validateShelter = (req, res, next) => {
    const { error } = shelterSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

module.exports.validateRequest = (req, res, next) => {
    const { error } = requestSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

module.exports.isIncidentAuthor = async (req, res, next) => {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident.reportedBy.equals(req.user._id) && req.user.role !== 'admin') {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/incidents/${id}`);
    }
    if (incident.status !== 'pending' && req.user.role !== 'admin' && req.method !== 'DELETE') {
        req.flash('error', 'Verified incidents cannot be edited.');
        return res.redirect(`/incidents/${id}`);
    }
    next();
};

module.exports.isRequestOwner = async (req, res, next) => {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request.requestedBy.equals(req.user._id) && req.user.role !== 'admin') {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/requests/${id}`);
    }
    next();
};
