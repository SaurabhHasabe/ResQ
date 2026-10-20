const express = require('express');
const router = express.Router();
const requests = require('../controllers/requests');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, validateRequest, isRequestOwner, isValidObjectId, isVolunteer, canClaimRequest } = require('../middleware');

router.route('/')
    .get(catchAsync(requests.index))
    .post(isLoggedIn, validateRequest, catchAsync(requests.createRequest));

router.get('/new', isLoggedIn, catchAsync(requests.renderNewForm));

router.route('/:id')
    .get(isValidObjectId, catchAsync(requests.showRequest))
    .delete(isLoggedIn, isValidObjectId, isRequestOwner, catchAsync(requests.deleteRequest));

router.post(
    '/:id/claim',
    isLoggedIn,
    isVolunteer,
    isValidObjectId,
    canClaimRequest,
    catchAsync(requests.claim)
);

module.exports = router;
