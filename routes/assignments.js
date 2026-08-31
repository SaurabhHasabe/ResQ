const express = require('express');
const router = express.Router();
const assignments = require('../controllers/assignments');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isVolunteer } = require('../middleware');

router.route('/')
    .get(isLoggedIn, isVolunteer, catchAsync(assignments.index));

router.route('/:id')
    .put(isLoggedIn, isVolunteer, catchAsync(assignments.updateStatus));

module.exports = router;
