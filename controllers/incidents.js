const Incident = require('../models/incident');
const User = require('../models/user');

module.exports.index = async (req, res) => {
    // Public feed: only verified incidents
    const { category, severity } = req.query;
    const filter = { status: 'verified' };
    if (category) filter.category = category;
    if (severity) filter.verifiedSeverity = severity;

    const incidents = await Incident.find(filter).populate('reportedBy');
    res.render('incidents/index', { incidents, category, severity });
};

module.exports.renderNewForm = (req, res) => {
    res.render('incidents/new');
};

module.exports.createIncident = async (req, res, next) => {
    const geoData = {
        type: 'Point',
        coordinates: [req.body.incident.longitude, req.body.incident.latitude]
    };
    const incident = new Incident(req.body.incident);
    incident.location = geoData;
    incident.reportedBy = req.user._id;

    // Check if Cloudinary files were uploaded
    if (req.files) {
        incident.photos = req.files.map(f => ({ url: f.path, filename: f.filename }));
    }

    await incident.save();
    req.flash('success', 'Successfully reported a new incident! It is pending verification.');
    res.redirect(`/incidents/${incident._id}`);
};

module.exports.showIncident = async (req, res) => {
    const incident = await Incident.findById(req.params.id)
        .populate('reportedBy')
        .populate('verifiedBy');
    if (!incident) {
        req.flash('error', 'Cannot find that incident!');
        return res.redirect('/incidents');
    }
    // Only show pending/rejected if author or admin
    if (['pending', 'rejected', 'duplicate'].includes(incident.status)) {
        if (!req.user) {
            req.flash('error', 'Cannot view unverified incident.');
            return res.redirect('/incidents');
        }
        if (req.user.role !== 'admin' && !incident.reportedBy.equals(req.user._id)) {
            req.flash('error', 'Cannot view unverified incident.');
            return res.redirect('/incidents');
        }
    }
    const volunteers = await User.find({ role: 'volunteer' });
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
    const geoData = {
        type: 'Point',
        coordinates: [req.body.incident.longitude, req.body.incident.latitude]
    };
    const incident = await Incident.findByIdAndUpdate(id, { ...req.body.incident });
    incident.location = geoData;
    if (req.files && req.files.length > 0) {
        const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
        incident.photos.push(...imgs);
    }
    await incident.save();
    req.flash('success', 'Successfully updated incident!');
    res.redirect(`/incidents/${incident._id}`);
};

const Assignment = require('../models/assignment');
const Request = require('../models/request');

module.exports.deleteIncident = async (req, res) => {
    const { id } = req.params;
    await Incident.findByIdAndDelete(id);
    await Assignment.deleteMany({ targetId: id, targetType: 'incident' });
    await Request.updateMany({ linkedIncident: id }, { linkedIncident: null });
    req.flash('success', 'Successfully deleted incident');
    res.redirect('/incidents');
};
