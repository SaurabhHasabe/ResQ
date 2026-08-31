const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');
const { normalizeIndianMobile, isValidIndianMobile } = require('./utils/phone');

const stripHtml = (value, helpers) => {
    const clean = sanitizeHtml(String(value), { allowedTags: [], allowedAttributes: {} }).trim();
    if (!clean) return helpers.error('string.empty');
    return clean;
};

const optionalStripHtml = (value, helpers) => {
    if (value == null || value === '') return '';
    return sanitizeHtml(String(value), { allowedTags: [], allowedAttributes: {} }).trim();
};

const objectId = Joi.string().hex().length(24);

const incidentSchema = Joi.object({
    incident: Joi.object({
        title: Joi.string().min(3).max(120).custom(stripHtml).required()
            .messages({ 'string.min': 'Title must be at least 3 characters' }),
        description: Joi.string().min(10).max(5000).custom(stripHtml).required()
            .messages({ 'string.min': 'Description must be at least 10 characters' }),
        category: Joi.string().valid('flood', 'fire', 'earthquake', 'building collapse', 'other').required(),
        selfReportedSeverity: Joi.string().valid('low', 'medium', 'high').required(),
        address: Joi.string().min(5).max(300).custom(stripHtml).required(),
        latitude: Joi.number().min(-90).max(90).required()
            .messages({ 'any.required': 'Pin a location on the map', 'number.base': 'Pin a location on the map' }),
        longitude: Joi.number().min(-180).max(180).required()
            .messages({ 'any.required': 'Pin a location on the map', 'number.base': 'Pin a location on the map' })
    }).required()
});

const shelterSchema = Joi.object({
    shelter: Joi.object({
        name: Joi.string().min(2).max(120).custom(stripHtml).required(),
        address: Joi.string().min(5).max(300).custom(stripHtml).required(),
        totalCapacity: Joi.number().integer().min(1).max(100000).required(),
        currentOccupancy: Joi.number().integer().min(0).max(100000).required(),
        status: Joi.string().valid('open', 'full', 'closed').required(),
        latitude: Joi.number().min(-90).max(90).required()
            .messages({ 'any.required': 'Pin a location on the map', 'number.base': 'Pin a location on the map' }),
        longitude: Joi.number().min(-180).max(180).required()
            .messages({ 'any.required': 'Pin a location on the map', 'number.base': 'Pin a location on the map' })
    }).required().custom((value, helpers) => {
        if (value.currentOccupancy > value.totalCapacity) {
            return helpers.message('Current occupancy cannot exceed total capacity');
        }
        return value;
    })
});

const requestSchema = Joi.object({
    request: Joi.object({
        type: Joi.string().valid('rescue', 'medical', 'food', 'water', 'shelter', 'other').required(),
        urgency: Joi.string().valid('low', 'medium', 'high').required(),
        description: Joi.string().min(10).max(5000).custom(stripHtml).required()
            .messages({ 'string.min': 'Description must be at least 10 characters' }),
        address: Joi.string().min(5).max(300).custom(stripHtml).required(),
        linkedIncident: Joi.alternatives().try(objectId, Joi.string().valid('')).optional(),
        latitude: Joi.number().min(-90).max(90).required()
            .messages({ 'any.required': 'Pin a location on the map', 'number.base': 'Pin a location on the map' }),
        longitude: Joi.number().min(-180).max(180).required()
            .messages({ 'any.required': 'Pin a location on the map', 'number.base': 'Pin a location on the map' })
    }).required()
});

const userSchema = Joi.object({
    username: Joi.string().trim().pattern(/^[a-zA-Z0-9_]{3,30}$/).required()
        .messages({ 'string.pattern.base': 'Username must be 3–30 letters, numbers, or underscores' }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).lowercase().required()
        .messages({ 'string.email': 'Enter a valid email address' }),
    phone: Joi.string().allow('', null).optional().custom((value, helpers) => {
        if (value == null || String(value).trim() === '') return '';
        const ten = normalizeIndianMobile(value);
        if (!isValidIndianMobile(ten)) {
            return helpers.message('Enter a valid 10-digit Indian mobile number');
        }
        return ten;
    }),
    password: Joi.string().min(8).max(128).required()
        .messages({ 'string.min': 'Password must be at least 8 characters' }),
    role: Joi.string().valid('citizen', 'volunteer').required()
});

const assignmentUpdateSchema = Joi.object({
    status: Joi.string().valid('assigned', 'en_route', 'in_progress', 'resolved').required(),
    fieldNotes: Joi.string().allow('').max(2000).custom(optionalStripHtml)
});

const verifyIncidentSchema = Joi.object({
    status: Joi.string().valid('verified', 'rejected', 'duplicate').required(),
    verifiedSeverity: Joi.string().valid('low', 'medium', 'high').when('status', {
        is: 'verified',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null)
    }),
    priorityScore: Joi.alternatives().try(
        Joi.number().min(0).max(1000),
        Joi.string().allow('')
    )
});

const assignSchema = Joi.object({
    volunteerId: objectId.required().messages({ 'string.length': 'Select a volunteer' }),
    targetType: Joi.string().valid('incident', 'request').required(),
    targetId: objectId.required()
});

module.exports = {
    incidentSchema,
    shelterSchema,
    requestSchema,
    userSchema,
    assignmentUpdateSchema,
    verifyIncidentSchema,
    assignSchema
};
