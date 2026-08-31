const express = require('express');
const router = express.Router();
const shelters = require('../controllers/shelters');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin, validateShelter, isValidObjectId } = require('../middleware');

router.route('/')
    .get(catchAsync(shelters.index))
    .post(isLoggedIn, isAdmin, validateShelter, catchAsync(shelters.createShelter));

router.get('/new', isLoggedIn, isAdmin, shelters.renderNewForm);

router.route('/:id')
    .get(isValidObjectId, catchAsync(shelters.showShelter))
    .put(isLoggedIn, isAdmin, isValidObjectId, validateShelter, catchAsync(shelters.updateShelter))
    .delete(isLoggedIn, isAdmin, isValidObjectId, catchAsync(shelters.deleteShelter));

router.get('/:id/edit', isLoggedIn, isAdmin, isValidObjectId, catchAsync(shelters.renderEditForm));

module.exports = router;
