const express = require('express');
const router = express.Router();
const incidents = require('../controllers/incidents');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isIncidentAuthor, validateIncident, isValidObjectId } = require('../middleware');
const { upload } = require('../cloudConfig');

router.route('/')
    .get(catchAsync(incidents.index))
    .post(isLoggedIn, upload.array('incident[photos]', 5), validateIncident, catchAsync(incidents.createIncident));

router.get('/new', isLoggedIn, incidents.renderNewForm);

router.route('/:id')
    .get(isValidObjectId, catchAsync(incidents.showIncident))
    .put(isLoggedIn, isValidObjectId, isIncidentAuthor, upload.array('incident[photos]', 5), validateIncident, catchAsync(incidents.updateIncident))
    .delete(isLoggedIn, isValidObjectId, isIncidentAuthor, catchAsync(incidents.deleteIncident));

router.get('/:id/edit', isLoggedIn, isValidObjectId, isIncidentAuthor, catchAsync(incidents.renderEditForm));

module.exports = router;
