const VolunteerApplication = require('../models/volunteerApplication');
const User = require('../models/user');
const { volunteerLocationSchema } = require('../schema');
const { toPoint } = require('../utils/geo');
const { isSudoAdminEmail } = require('../utils/sudoAdmins');
const { notifyAdmins, notifyUser } = require('../utils/notify');
const { audit } = require('../utils/audit');

module.exports.renderApply = async (req, res) => {
    if (req.user.volunteerStatus === 'pending') {
        req.flash('error', 'Your volunteer application is already under review.');
        return res.redirect('/profile');
    }
    const existing = await VolunteerApplication.findOne({
        applicant: req.user._id
    }).sort({ createdAt: -1 });
    res.render('volunteers/apply', { existing });
};

module.exports.apply = async (req, res) => {
    if (req.user.role !== 'citizen') {
        req.flash('error', 'Only citizens can apply to become volunteers.');
        return res.redirect('/profile');
    }

    const pending = await VolunteerApplication.findOne({
        applicant: req.user._id,
        status: 'pending'
    });
    if (pending) {
        req.flash('error', 'You already have a volunteer application under review.');
        return res.redirect('/profile');
    }

    const skills = [].concat(req.body.skills || []).filter(Boolean);
    const application = new VolunteerApplication({
        applicant: req.user._id,
        skills,
        availability: req.body.availability,
        experience: req.body.experience,
        message: req.body.message || ''
    });
    await application.save();

    if (req.body.phone && !req.user.phone) {
        req.user.phone = req.body.phone;
        await req.user.save();
    }

    req.user.volunteerStatus = 'pending';
    await req.user.save();

    await notifyAdmins({
        title: 'Volunteer application pending',
        body: `${req.user.username} applied to join on-ground response.`,
        href: '/admin/dashboard',
        kind: 'volunteer'
    });
    await audit({
        actor: req.user._id,
        action: 'volunteer.applied',
        targetType: 'volunteerApplication',
        targetId: application._id,
        summary: `${req.user.username} applied to become a volunteer`
    });
    req.flash('success', 'Application submitted. An admin will review it shortly.');
    res.redirect('/profile');
};

module.exports.updateLocation = async (req, res) => {
    const { error, value } = volunteerLocationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({ ok: false, error: 'Share a valid location.' });
    }
    req.user.lastLocation = toPoint(value.longitude, value.latitude);
    req.user.lastLocatedAt = new Date();
    await req.user.save();
    return res.json({ ok: true });
};

module.exports.review = async (req, res) => {
    const application = await VolunteerApplication.findById(req.params.id).populate('applicant');
    if (!application || application.status !== 'pending') {
        req.flash('error', 'That application is no longer pending.');
        return res.redirect('/admin/dashboard');
    }

    const { status, adminNote } = req.body;
    application.status = status;
    application.adminNote = adminNote || '';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    const applicant = await User.findById(application.applicant._id);
    if (applicant) {
        if (status === 'approved') {
            applicant.role = isSudoAdminEmail(applicant.email) ? 'admin' : 'volunteer';
            applicant.volunteerStatus = 'approved';
        } else if (!isSudoAdminEmail(applicant.email)) {
            applicant.role = 'citizen';
            applicant.volunteerStatus = 'rejected';
        }
        await applicant.save();
    }

    if (applicant) {
        await notifyUser(applicant, {
            title: status === 'approved' ? 'You are now a ResQ volunteer' : 'Volunteer application update',
            body: status === 'approved'
                ? 'An admin approved you. Open Assignments and share location to receive nearby tasks.'
                : (adminNote || 'Your application was not approved this time. You can apply again from your hub.'),
            href: status === 'approved' ? '/assignments' : '/volunteer/apply',
            kind: 'volunteer'
        });
    }
    await audit({
        actor: req.user._id,
        action: `volunteer.${status}`,
        targetType: 'user',
        targetId: applicant && applicant._id,
        summary: `${req.user.username} ${status} volunteer application for ${application.applicant.username}`
    });
    req.flash('success', status === 'approved'
        ? `${application.applicant.username} is now a volunteer.`
        : `Application from ${application.applicant.username} was declined.`);
    res.redirect('/admin/dashboard');
};
