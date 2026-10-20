module.exports.sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
        }
    };
    sanitize(req.body);
    sanitize(req.params);
    next();
};

const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
const {
    incidentSchema,
    shelterSchema,
    requestSchema,
    userSchema,
    forgotSchema,
    adminResetSchema,
    assignmentUpdateSchema,
    verifyIncidentSchema,
    assignSchema,
    volunteerApplySchema,
    reviewSchema
} = require('./schema');
const Incident = require('./models/incident');
const Request = require('./models/request');
const Shelter = require('./models/shelter');
const geo = require('./utils/geo');
const { promoteSudoAdmin } = require('./utils/sudoAdmins');

function validationMessages(error) {
    return error.details.map(el => el.message.replace(/['"]/g, '')).join('. ');
}

function makeValidator(schema, getRedirect) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            req.flash('error', validationMessages(error));
            const redirectTo = typeof getRedirect === 'function' ? getRedirect(req) : getRedirect;
            return res.redirect(redirectTo || req.get('Referrer') || req.get('Referer') || '/');
        }
        req.body = value;
        next();
    };
}

module.exports.isValidObjectId = (req, res, next) => {
    for (const value of Object.values(req.params)) {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
            req.flash('error', 'Invalid ID.');
            return res.redirect(req.baseUrl || '/');
        }
    }
    next();
};

module.exports.validateUser = makeValidator(userSchema, '/register');
module.exports.validateIncident = makeValidator(incidentSchema, (req) => (
    req.params.id ? `/incidents/${req.params.id}/edit` : '/incidents/new'
));
module.exports.validateShelter = makeValidator(shelterSchema, (req) => (
    req.params.id ? `/shelters/${req.params.id}/edit` : '/shelters/new'
));
module.exports.validateRequest = makeValidator(requestSchema, '/requests/new');
module.exports.validateAssignment = makeValidator(assignmentUpdateSchema, '/assignments');
module.exports.validateVerify = makeValidator(verifyIncidentSchema, '/admin/dashboard');
module.exports.validateAssign = makeValidator(assignSchema, (req) => req.get('Referrer') || req.get('Referer') || '/admin/dashboard');
module.exports.validateVolunteerApply = makeValidator(volunteerApplySchema, '/volunteer/apply');
module.exports.validateForgot = makeValidator(forgotSchema, '/forgot');
module.exports.validateAdminReset = makeValidator(adminResetSchema, '/admin/dashboard');
module.exports.validateReview = makeValidator(reviewSchema, (req) => req.get('Referrer') || req.get('Referer') || '/admin/dashboard');

module.exports.promoteSudoAdmin = catchAsync(async (req, res, next) => {
    if (req.user) {
        await promoteSudoAdmin(req.user);
    }
    next();
});

module.exports.canReviewIncident = catchAsync(async (req, res, next) => {
    const incident = req.incident || await Incident.findById(req.params.id);
    if (!incident) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    if (incident.status !== 'pending') {
        req.flash('error', 'This incident has already been reviewed.');
        return res.redirect(`/incidents/${incident._id}`);
    }
    const allowed = await geo.isNearestReviewer(req.user, incident.location);
    if (!allowed) {
        req.flash('error', 'Only the nearest volunteers on the ground can accept or reject this report.');
        return res.redirect(req.user.role === 'volunteer' ? '/assignments' : '/admin/dashboard');
    }
    req.incident = incident;
    next();
});

module.exports.canClaimRequest = catchAsync(async (req, res, next) => {
    const request = await Request.findById(req.params.id);
    if (!request) {
        req.flash('error', 'Cannot find that request!');
        return res.redirect('/requests');
    }
    if (request.status !== 'open') {
        req.flash('error', 'This aid request is no longer open.');
        return res.redirect(`/requests/${request._id}`);
    }
    const allowed = await geo.isNearestReviewer(req.user, request.location);
    if (!allowed) {
        req.flash('error', 'Only the nearest volunteers can accept this aid request.');
        return res.redirect('/assignments');
    }
    req.aidRequest = request;
    next();
});

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
        return next();
    }
    req.flash('error', 'You do not have permission to do that.');
    return res.redirect('/');
};

module.exports.isVolunteer = (req, res, next) => {
    if (req.user && (req.user.role === 'volunteer' || req.user.role === 'admin')) {
        return next();
    }
    req.flash('error', 'Only approved volunteers can access assignments. Apply from your profile.');
    return res.redirect('/profile');
};

module.exports.isCitizen = (req, res, next) => {
    if (req.user && req.user.role === 'citizen') {
        return next();
    }
    req.flash('error', 'This action is for citizens.');
    return res.redirect('/profile');
};

module.exports.isShelterManager = catchAsync(async (req, res, next) => {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    const isOwner = shelter.managedBy && shelter.managedBy.equals(req.user._id);
    if (req.user.role === 'admin' || isOwner) {
        req.shelter = shelter;
        return next();
    }
    req.flash('error', 'You can only manage a shelter you listed.');
    return res.redirect(`/shelters/${req.params.id}`);
});

module.exports.isIncidentAuthor = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    const isOwner = incident.reportedBy && incident.reportedBy.equals(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/incidents/${id}`);
    }
    if (incident.status !== 'pending' && req.user.role !== 'admin' && req.method !== 'DELETE') {
        req.flash('error', 'Verified incidents cannot be edited.');
        return res.redirect(`/incidents/${id}`);
    }
    next();
});

module.exports.isRequestOwner = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) {
        req.flash('error', 'Cannot find that request!');
        return res.redirect('/requests');
    }
    const isOwner = request.requestedBy && request.requestedBy.equals(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/requests/${id}`);
    }
    next();
});
