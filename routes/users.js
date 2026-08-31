const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const passport = require('passport');
const { rateLimit } = require('express-rate-limit');
const { storeReturnTo, validateUser, isLoggedIn } = require('../middleware');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: 'Too many attempts. Please try again in 15 minutes.'
});

router.route('/register')
    .get(users.renderRegister)
    .post(authLimiter, validateUser, catchAsync(users.register));

router.route('/login')
    .get(users.renderLogin)
    .post(
        authLimiter,
        storeReturnTo,
        passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
        users.login
    );

router.post('/logout', users.logout);
router.get('/logout', users.logout);

router.get('/profile', isLoggedIn, catchAsync(users.showProfile));

module.exports = router;
