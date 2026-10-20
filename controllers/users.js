const User = require('../models/user');
const Incident = require('../models/incident');
const Request = require('../models/request');
const Shelter = require('../models/shelter');
const Assignment = require('../models/assignment');
const VolunteerApplication = require('../models/volunteerApplication');
const crypto = require('crypto');
const { promoteSudoAdmin, isSudoAdminEmail } = require('../utils/sudoAdmins');
const { notifyAdmins } = require('../utils/notify');
const { audit } = require('../utils/audit');
const { normalizeIndianMobile } = require('../utils/phone');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password, phone } = req.body;
        const user = new User({
            email,
            username,
            phone: phone || '',
            role: isSudoAdminEmail(email) ? 'admin' : 'citizen',
            volunteerStatus: 'none'
        });
        const registeredUser = await User.register(user, password);
        await promoteSudoAdmin(registeredUser);
        req.login(registeredUser, err => {
            if (err) return next(err);
            if (registeredUser.role === 'admin') {
                req.flash('success', 'Welcome to ResQ. Administrator access is enabled for your account.');
                return res.redirect('/admin/dashboard');
            }
            notifyAdmins({
                title: 'New citizen on ResQ',
                body: `${registeredUser.username} registered and can now report incidents.`,
                href: '/admin/dashboard',
                kind: 'system',
            }).catch(() => {});
            req.flash('success', 'Welcome to ResQ. You can report incidents, request aid, or offer your home as a shelter.');
            res.redirect('/profile');
        });
    } catch (e) {
        const msg = e.code === 11000
            ? 'A user with that email already exists.'
            : (e.message || 'Registration failed.');
        req.flash('error', msg);
        res.redirect('/register');
    }
};

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
};

module.exports.login = async (req, res) => {
    await promoteSudoAdmin(req.user);
    req.flash('success', 'Welcome back!');
    const fallback = req.user.role === 'admin'
        ? '/admin/dashboard'
        : req.user.role === 'volunteer'
            ? '/assignments'
            : '/profile';
    const redirectUrl = res.locals.returnTo || fallback;
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
};

module.exports.showProfile = async (req, res) => {
    const user = req.user;
    const incidents = await Incident.find({ reportedBy: user._id }).sort({ createdAt: -1 }).limit(20);
    const requests = await Request.find({ requestedBy: user._id }).sort({ createdAt: -1 }).limit(20);
    const shelters = await Shelter.find({ managedBy: user._id }).sort({ createdAt: -1 });
    const volunteerApp = await VolunteerApplication.findOne({ applicant: user._id }).sort({ createdAt: -1 });

    let assignmentStats = null;
    if (user.role === 'volunteer' || user.role === 'admin') {
        const assignments = await Assignment.find({ volunteer: user._id });
        assignmentStats = {
            total: assignments.length,
            active: assignments.filter(a => a.status !== 'resolved').length,
            resolved: assignments.filter(a => a.status === 'resolved').length
        };
    }

    res.render('users/profile', {
        incidents,
        requests,
        shelters,
        volunteerApp,
        assignmentStats
    });
};

module.exports.renderForgot = (req, res) => {
    res.render('users/forgot');
};

module.exports.forgot = async (req, res) => {
    const username = String(req.body.username || '').trim();
    const phone = normalizeIndianMobile(req.body.phone);
    const user = await User.findOne({ username });
    const phoneOk = user && user.phone && user.phone === phone;
    if (!phoneOk) {
        req.flash('error', 'Username and phone did not match an account. If you have no phone on file, ask an admin to issue a new password.');
        return res.redirect('/forgot');
    }
    await user.setPassword(req.body.password);
    await user.save();
    await audit({
        actor: user._id,
        action: 'password.reset',
        targetType: 'user',
        targetId: user._id,
        summary: `${user.username} reset their password with phone verification`
    });
    req.flash('success', 'Password updated. You can log in now.');
    res.redirect('/login');
};

function tempPassword() {
    return `ResQ-${crypto.randomBytes(4).toString('hex')}`;
}

module.exports.adminIssuePassword = async (req, res) => {
    const username = String(req.body.username || '').trim();
    const user = await User.findOne({ username });
    if (!user) {
        req.flash('error', 'No user with that username.');
        return res.redirect('/admin/dashboard');
    }
    const nextPass = tempPassword();
    await user.setPassword(nextPass);
    await user.save();
    await audit({
        actor: req.user._id,
        action: 'password.issued',
        targetType: 'user',
        targetId: user._id,
        summary: `${req.user.username} issued a new password for ${user.username}`
    });
    req.flash('success', `New password for ${user.username}: ${nextPass} — share it once, then they should change it after login.`);
    res.redirect('/admin/dashboard');
};
