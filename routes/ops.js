const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ops = require('../controllers/ops');
const { isLoggedIn, isAdmin } = require('../middleware');

router.get('/', catchAsync(ops.home));
router.get('/api/ops', catchAsync(ops.feed));
router.get('/notifications', isLoggedIn, catchAsync(ops.notifications));
router.post('/notifications/read', isLoggedIn, catchAsync(ops.markRead));

module.exports = router;
