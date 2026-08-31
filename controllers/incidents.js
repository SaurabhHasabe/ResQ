const Incident = require('../models/incident');
const User = require('../models/user');
const Assignment = require('../models/assignment');
const Request = require('../models/request');
const { mapUploadedPhotos } = require('../cloudConfig');
const escapeHtml = require('../utils/escapeHtml');

const CATEGORIES = ['flood', 'fire', 'earthquake', 'building collapse', 'other'];
const SEVERITIES = ['low', 'medium', 'high'];

function pointFromBody(incident) {
    return {
        type: 'Point',
        coordinates: [Number(incident.longitude), Number(incident.latitude)]
    };
}

module.exports.index = async (req, res) => {
    const { category, severity } = req.query;
    const filter = { status: 'verified' };
    if (CATEGORIES.includes(category)) filter.category = category;
    if (SEVERITIES.includes(severity)) filter.verifiedSeverity = severity;

    const incidents = await Incident.find(filter).populate('reportedBy');
    const popups = incidents.map(i => ({
        coordinates: i.location.coordinates,
        popupMarkup: `<b>${escapeHtml(i.title)}</b><br>${escapeHtml(i.verifiedSeverity || i.selfReportedSeverity)} severity<br><a href="/incidents/${i._id}">View</a>`
    }));
    res.render('incidents/index', {
        incidents,
        category: CATEGORIES.includes(category) ? category : '',
        severity: SEVERITIES.includes(severity) ? severity : '',
        popups
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render('incidents/new');
};

module.exports.createIncident = async (req, res) => {
    const { title, description, category, selfReportedSeverity, address } = req.body.incident;
    const incident = new Incident({
        title,
        description,
        category,
        selfReportedSeverity,
        address,
        location: pointFromBody(req.body.incident),
        reportedBy: req.user._id,
        photos: mapUploadedPhotos(req.files)
    });
    await incident.save();
    req.flash('success', 'Successfully reported a new incident! It is pending verification.');
    res.redirect(`/incidents/${incident._id}`);
};

module.exports.showIncident = async (req, res) => {
    const incident = await Incident.findById(req.params.id)
        .populate('reportedBy')
        .populate('verifiedBy');
    if (!incident || !incident.location) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    if (['pending', 'rejected', 'duplicate'].includes(incident.status)) {
        if (!req.user) {
            req.flash('error', 'Cannot view unverified incident.');
            return res.redirect('/incidents');
        }
        const isOwner = incident.reportedBy && incident.reportedBy.equals(req.user._id);
        if (req.user.role !== 'admin' && !isOwner) {
            req.flash('error', 'Cannot view unverified incident.');
            return res.redirect('/incidents');
        }
    }
    const volunteers = await User.find({ role: 'volunteer' }).select('username');
    res.render('incidents/show', { incident, volunteers });
};

module.exports.renderEditForm = async (req, res) => {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    res.render('incidents/edit', { incident });
};

module.exports.updateIncident = async (req, res) => {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    const { title, description, category, selfReportedSeverity, address } = req.body.incident;
    incident.title = title;
    incident.description = description;
    incident.category = category;
    incident.selfReportedSeverity = selfReportedSeverity;
    incident.address = address;
    incident.location = pointFromBody(req.body.incident);
    const extraPhotos = mapUploadedPhotos(req.files);
    if (extraPhotos.length) {
        incident.photos.push(...extraPhotos);
    }
    await incident.save();
    req.flash('success', 'Successfully updated incident!');
    res.redirect(`/incidents/${incident._id}`);
};

module.exports.deleteIncident = async (req, res) => {
    const { id } = req.params;
    const incident = await Incident.findByIdAndDelete(id);
    if (!incident) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    await Assignment.deleteMany({ targetId: id, targetType: 'incident' });
    await Request.updateMany({ linkedIncident: id }, { linkedIncident: null });
    req.flash('success', 'Successfully deleted incident');
    res.redirect('/incidents');
};
