const { test } = require('node:test');
const assert = require('node:assert/strict');
const geo = require('../utils/geo');
const { isSudoAdminEmail } = require('../utils/sudoAdmins');
const { forgotSchema, userSchema } = require('../schema');
const { healthStatus } = require('../routes/health');

test('rejects empty geo points', () => {
    assert.equal(geo.isValidPoint(null), false);
    assert.equal(geo.isValidPoint({ type: null, coordinates: null }), false);
    assert.equal(geo.asPoint({ coordinates: null }), null);
});

test('accepts a WGS84 point', () => {
    const p = geo.toPoint(72.8777, 19.0728);
    assert.equal(geo.isValidPoint(p), true);
    assert.deepEqual(geo.asPoint(p).coordinates, [72.8777, 19.0728]);
});

test('sudo admin allowlist', () => {
    assert.equal(isSudoAdminEmail('utkarshkumar.cs18@gmail.com'), true);
    assert.equal(isSudoAdminEmail('SAURYA1729@gmail.com'), true);
    assert.equal(isSudoAdminEmail('random@example.com'), false);
});

test('register requires a valid Indian mobile', () => {
    const { error } = userSchema.validate({
        username: 'citizen1',
        email: 'c@example.com',
        password: 'password1'
    });
    assert.ok(error);
});

test('health payload names the service and reports db', async () => {
    const body = await healthStatus();
    assert.equal(body.service, 'resq');
    assert.equal(typeof body.ok, 'boolean');
    assert.ok(body.db === 'up' || body.db === 'down');
    assert.equal(typeof body.uptime, 'number');
    assert.ok(body.timestamp);
});

test('password recovery uses username and phone, not email', () => {
    const { error, value } = forgotSchema.validate({
        username: 'ravi_v',
        phone: '9823456781',
        password: 'password1',
        confirmPassword: 'password1'
    });
    assert.equal(error, undefined);
    assert.equal(value.phone, '9823456781');
});
