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
    assignmentUpdateSchema,
    verifyIncidentSchema,
    assignSchema
} = require('./schema');
const Incident = require('./models/incident');
const Request = require('./models/request');

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
    req.flash('error', 'You do not have permission to do that.');
    return res.redirect('/');
};

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
