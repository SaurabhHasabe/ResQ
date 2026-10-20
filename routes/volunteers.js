const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const volunteers = require('../controllers/volunteers');
const {
    isLoggedIn,
    isCitizen,
    isVolunteer,
    isAdmin,
    isValidObjectId,
    validateVolunteerApply,
    validateReview
} = require('../middleware');

router.route('/apply')
    .get(isLoggedIn, isCitizen, catchAsync(volunteers.renderApply))
    .post(isLoggedIn, isCitizen, validateVolunteerApply, catchAsync(volunteers.apply));

router.post('/location', isLoggedIn, isVolunteer, catchAsync(volunteers.updateLocation));

router.post(
    '/:id/review',
    isLoggedIn,
    isAdmin,
    isValidObjectId,
    validateReview,
    catchAsync(volunteers.review)
);

module.exports = router;
