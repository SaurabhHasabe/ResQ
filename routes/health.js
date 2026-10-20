const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

async function healthStatus() {
    let db = 'down';
    try {
        if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
            await mongoose.connection.db.admin().command({ ping: 1 });
            db = 'up';
        }
    } catch (_) {
        db = 'down';
    }
    return {
        ok: db === 'up',
        service: 'resq',
        db,
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    };
}

async function sendHealth(req, res) {
    const body = await healthStatus();
    res.set('Cache-Control', 'no-store');
    res.status(body.ok ? 200 : 503).json(body);
}

router.get('/', sendHealth);
router.head('/', sendHealth);

module.exports = router;
module.exports.healthStatus = healthStatus;
