const express = require('express');
const router = express.Router();
const incidents = require('../controllers/incidents');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isIncidentAuthor, validateIncident, isValidObjectId } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudConfig');
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.route('/')
    .get(catchAsync(incidents.index))
    .post(isLoggedIn, upload.array('incident[photos]'), validateIncident, catchAsync(incidents.createIncident));

router.get('/new', isLoggedIn, incidents.renderNewForm);

router.route('/:id')
    .get(isValidObjectId, catchAsync(incidents.showIncident))
    .put(isLoggedIn, isIncidentAuthor, upload.array('incident[photos]'), validateIncident, isValidObjectId, catchAsync(incidents.updateIncident))
    .delete(isLoggedIn, isIncidentAuthor, isValidObjectId, catchAsync(incidents.deleteIncident));

router.get('/:id/edit', isLoggedIn, isIncidentAuthor, isValidObjectId, catchAsync(incidents.renderEditForm));

module.exports = router;
