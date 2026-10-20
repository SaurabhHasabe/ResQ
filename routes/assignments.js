const express = require('express');
const router = express.Router();
const assignments = require('../controllers/assignments');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isVolunteer, isValidObjectId, validateAssignment } = require('../middleware');

const updateAssignment = [
    isLoggedIn,
    isVolunteer,
    isValidObjectId,
    validateAssignment,
    catchAsync(assignments.updateStatus)
];

router.route('/')
    .get(isLoggedIn, isVolunteer, catchAsync(assignments.index));

router.post('/:id', ...updateAssignment);
router.put('/:id', ...updateAssignment);

module.exports = router;
