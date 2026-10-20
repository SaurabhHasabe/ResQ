const express = require('express');
const router = express.Router();
const shelters = require('../controllers/shelters');
const catchAsync = require('../utils/catchAsync');
const {
    isLoggedIn,
    isShelterManager,
    validateShelter,
    isValidObjectId
} = require('../middleware');

router.route('/')
    .get(catchAsync(shelters.index))
    .post(isLoggedIn, validateShelter, catchAsync(shelters.createShelter));

router.get('/new', isLoggedIn, shelters.renderNewForm);

router.route('/:id')
    .get(isValidObjectId, catchAsync(shelters.showShelter))
    .put(isLoggedIn, isValidObjectId, isShelterManager, validateShelter, catchAsync(shelters.updateShelter))
    .delete(isLoggedIn, isValidObjectId, isShelterManager, catchAsync(shelters.deleteShelter));

router.get('/:id/edit', isLoggedIn, isValidObjectId, isShelterManager, catchAsync(shelters.renderEditForm));

module.exports = router;
