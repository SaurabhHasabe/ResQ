const User = require('../models/user');
const Shelter = require('../models/shelter');
const Incident = require('../models/incident');
const Request = require('../models/request');

const REVIEW_RADIUS_METERS = 50000;
const SHELTER_RADIUS_METERS = 25000;
const NEAREST_REVIEWERS = 3;

function isValidPoint(loc) {
    if (!loc) return false;
    const coords = loc.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) return false;
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    return Number.isFinite(lng) && Number.isFinite(lat)
        && lng >= -180 && lng <= 180
        && lat >= -90 && lat <= 90;
}

function asPoint(loc) {
    if (!isValidPoint(loc)) return null;
    return {
        type: 'Point',
        coordinates: [Number(loc.coordinates[0]), Number(loc.coordinates[1])]
    };
}

function toPoint(lng, lat) {
    return { type: 'Point', coordinates: [Number(lng), Number(lat)] };
}

function haversineMeters(coordsA, coordsB) {
    if (!coordsA || !coordsB || coordsA.length < 2 || coordsB.length < 2) return null;
    const [lng1, lat1] = coordsA;
    const [lng2, lat2] = coordsB;
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
    if (meters == null) return '';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

async function nearestVolunteers(point, limit = NEAREST_REVIEWERS) {
    const geometry = asPoint(point);
    if (!geometry) return [];
    return User.find({
        role: 'volunteer',
        lastLocation: {
            $near: {
                $geometry: geometry,
                $maxDistance: REVIEW_RADIUS_METERS
            }
        }
    }).select('username lastLocation lastLocatedAt').limit(limit);
}

async function isNearestReviewer(user, point) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'volunteer' || !isValidPoint(user.lastLocation)) return false;
    const nearest = await nearestVolunteers(point);
    return nearest.some((v) => v._id.equals(user._id));
}

async function nearestOpenShelters(point, limit = 5) {
    const geometry = asPoint(point);
    if (!geometry) return [];
    return Shelter.find({
        verificationStatus: 'approved',
        status: 'open',
        location: {
            $near: {
                $geometry: geometry,
                $maxDistance: SHELTER_RADIUS_METERS
            }
        }
    }).limit(limit);
}

async function nearbyPendingIncidents(volunteer, limit = 20) {
    const geometry = volunteer && asPoint(volunteer.lastLocation);
    if (!geometry) return [];
    return Incident.find({
        status: 'pending',
        location: {
            $near: {
                $geometry: geometry,
                $maxDistance: REVIEW_RADIUS_METERS
            }
        }
    }).limit(limit);
}

async function similarIncidents(point, category, excludeId, limit = 5) {
    const geometry = asPoint(point);
    if (!geometry) return [];
    const filter = {
        category,
        status: { $in: ['pending', 'verified'] },
        location: {
            $near: {
                $geometry: geometry,
                $maxDistance: 2000
            }
        }
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return Incident.find(filter).limit(limit);
}

async function nearbyOpenRequests(volunteer, limit = 20) {
    const geometry = volunteer && asPoint(volunteer.lastLocation);
    if (!geometry) return [];
    return Request.find({
        status: 'open',
        location: {
            $near: {
                $geometry: geometry,
                $maxDistance: REVIEW_RADIUS_METERS
            }
        }
    }).limit(limit);
}

function withDistance(docs, fromCoords) {
    return docs.map((doc) => {
        const meters = haversineMeters(fromCoords, doc.location && doc.location.coordinates);
        const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        plain.distanceMeters = meters;
        plain.distanceLabel = formatDistance(meters);
        return plain;
    });
}

module.exports = {
    isValidPoint,
    asPoint,
    toPoint,
    nearestVolunteers,
    isNearestReviewer,
    nearestOpenShelters,
    nearbyPendingIncidents,
    similarIncidents,
    nearbyOpenRequests,
    withDistance
};
