const User = require('../models/user');
const Incident = require('../models/incident');
const Request = require('../models/request');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password, phone, role } = req.body;
        // Don't allow creating admin through this route
        const userRole = role === 'volunteer' ? 'volunteer' : 'citizen';
        const user = new User({ email, username, phone, role: userRole });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to ResQ!');
            res.redirect('/incidents');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
};

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
};

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = res.locals.returnTo || '/incidents';
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/incidents');
    });
};

module.exports.showProfile = async (req, res) => {
    const user = req.user;
    const incidents = await Incident.find({ reportedBy: user._id }).sort({ createdAt: -1 });
    const requests = await Request.find({ requestedBy: user._id }).sort({ createdAt: -1 });
    res.render('users/profile', { incidents, requests });
};
