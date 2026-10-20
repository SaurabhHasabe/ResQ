const express = require('express');
const userRoutes = require('./users');
const incidentRoutes = require('./incidents');
const shelterRoutes = require('./shelters');
const requestRoutes = require('./requests');
const adminRoutes = require('./admin');
const assignmentRoutes = require('./assignments');
const volunteerRoutes = require('./volunteers');
const opsRoutes = require('./ops');

const router = express.Router();

function sendAppIcon(req, res) {
    res.type('image/svg+xml');
    res.sendFile('favicon.svg', { root: require('path').join(__dirname, '..', 'public') });
}

router.get('/favicon.ico', sendAppIcon);
router.get('/apple-touch-icon.png', sendAppIcon);
router.get('/apple-touch-icon-precomposed.png', sendAppIcon);
router.get('/apple-touch-icon-120x120.png', sendAppIcon);
router.get('/apple-touch-icon-152x152.png', sendAppIcon);
router.get('/apple-touch-icon-167x167.png', sendAppIcon);
router.get('/apple-touch-icon-180x180.png', sendAppIcon);

router.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(204).end();
});

router.get('/robots.txt', (req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow:\n');
});

router.use('/', opsRoutes);
router.use('/', userRoutes);
router.use('/incidents', incidentRoutes);
router.use('/shelters', shelterRoutes);
router.use('/requests', requestRoutes);
router.use('/admin', adminRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/volunteer', volunteerRoutes);

module.exports = router;
