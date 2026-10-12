const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./users');
const incidentRoutes = require('./incidents');
const shelterRoutes = require('./shelters');
const requestRoutes = require('./requests');
const adminRoutes = require('./admin');
const assignmentRoutes = require('./assignments');

const router = express.Router();

router.get('/health', (req, res) => {
    const dbOk = mongoose.connection.readyState === 1;
    res.status(dbOk ? 200 : 503).json({ ok: dbOk });
});

// Browsers always request /favicon.ico — serve our SVG to prevent 404 logs
router.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/favicon.svg');
});

router.get('/', (req, res) => {
    res.redirect('/incidents');
});

router.use('/', userRoutes);
router.use('/incidents', incidentRoutes);
router.use('/shelters', shelterRoutes);
router.use('/requests', requestRoutes);
router.use('/admin', adminRoutes);
router.use('/assignments', assignmentRoutes);

module.exports = router;
