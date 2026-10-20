const Incident = require('../models/incident');
const User = require('../models/user');
const Assignment = require('../models/assignment');
const Request = require('../models/request');
const { mapUploadedPhotos } = require('../cloudConfig');
const escapeHtml = require('../utils/escapeHtml');
const geo = require('../utils/geo');
const { calculateScore } = require('../utils/priority');
const { notifyAdmins, notifyMany, notifyUser } = require('../utils/notify');
const { audit } = require('../utils/audit');

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

    const similar = await geo.similarIncidents(incident.location, incident.category, incident._id);
    const nearest = await geo.nearestVolunteers(incident.location);
    await notifyAdmins({
        title: 'New incident pending review',
        body: `${incident.title} at ${incident.address}`,
        href: `/incidents/${incident._id}`,
        kind: 'incident'
    });
    await notifyMany(nearest, {
        title: 'Nearby incident needs verification',
        body: `${incident.title} — you are among the nearest volunteers.`,
        href: `/incidents/${incident._id}`,
        kind: 'incident'
    });
    await audit({
        actor: req.user._id,
        action: 'incident.reported',
        targetType: 'incident',
        targetId: incident._id,
        summary: `${req.user.username} reported "${incident.title}"`
    });

    if (similar.length) {
        req.flash('error', `Reported. ${similar.length} similar nearby report(s) already exist — volunteers will check for duplicates.`);
    } else {
        req.flash('success', 'Incident reported. Nearest volunteers and admins have been alerted.');
    }
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
        const canReview = await geo.isNearestReviewer(req.user, incident.location);
        if (!canReview && !isOwner) {
            req.flash('error', 'Cannot view unverified incident.');
            return res.redirect('/incidents');
        }
    }
    const volunteers = await User.find({ role: 'volunteer' }).select('username');
    const nearestReviewers = incident.status === 'pending'
        ? await geo.nearestVolunteers(incident.location)
        : [];
    const canReview = req.user
        ? await geo.isNearestReviewer(req.user, incident.location)
        : false;
    const nearbyShelters = await geo.nearestOpenShelters(incident.location);
    res.render('incidents/show', {
        incident,
        volunteers,
        nearestReviewers,
        canReview,
        nearbyShelters
    });
};

module.exports.review = async (req, res) => {
    const incident = req.incident || await Incident.findById(req.params.id);
    if (!incident) {
        req.flash('error', 'Incident not found');
        return res.redirect('/incidents');
    }
    if (incident.status !== 'pending') {
        req.flash('error', 'This incident has already been reviewed.');
        return res.redirect(`/incidents/${incident._id}`);
    }

    const { status, verifiedSeverity, priorityScore } = req.body;
    incident.status = status;
    incident.verifiedBy = req.user._id;
    incident.verifiedAt = new Date();

    if (status === 'verified') {
        incident.verifiedSeverity = verifiedSeverity || incident.selfReportedSeverity;
        incident.priorityScore = priorityScore === '' || priorityScore == null
            ? calculateScore(incident)
            : Number(priorityScore);

        if (req.user.role === 'volunteer') {
            const duplicate = await Assignment.findOne({
                volunteer: req.user._id,
                targetType: 'incident',
                targetId: incident._id,
                status: { $ne: 'resolved' }
            });
            if (!duplicate) {
                await Assignment.create({
                    volunteer: req.user._id,
                    targetType: 'incident',
                    targetId: incident._id,
                    assignedBy: req.user._id,
                    status: 'assigned'
                });
            }
        }
    }

    await incident.save();
    await audit({
        actor: req.user._id,
        action: `incident.${status}`,
        targetType: 'incident',
        targetId: incident._id,
        summary: `${req.user.username} marked "${incident.title}" as ${status}`
    });
    if (incident.reportedBy) {
        await notifyUser(incident.reportedBy, {
            title: status === 'verified' ? 'Your incident was verified' : `Your incident was marked ${status}`,
            body: incident.title,
            href: `/incidents/${incident._id}`,
            kind: 'incident'
        });
    }
    const who = req.user.role === 'volunteer' ? 'You' : 'Admin';
    req.flash('success', status === 'verified'
        ? `${who} accepted this report. Nearby volunteers can now respond.`
        : `Incident marked as ${status}.`);
    res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : `/incidents/${incident._id}`);
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
