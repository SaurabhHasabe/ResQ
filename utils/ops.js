const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Request = require('../models/request');
const User = require('../models/user');
const Assignment = require('../models/assignment');
const escapeHtml = require('./escapeHtml');

async function opsSnapshot() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
        verifiedIncidents,
        incidents24h,
        pendingIncidents,
        openRequests,
        approvedShelters,
        activeVolunteers,
        activeAssignments
    ] = await Promise.all([
        Incident.countDocuments({ status: 'verified' }),
        Incident.countDocuments({ createdAt: { $gte: since } }),
        Incident.countDocuments({ status: 'pending' }),
        Request.countDocuments({ status: 'open' }),
        Shelter.find({ verificationStatus: 'approved' }),
        User.countDocuments({ role: 'volunteer' }),
        Assignment.countDocuments({ status: { $ne: 'resolved' } })
    ]);

    let capacity = 0;
    let occupancy = 0;
    const openShelters = approvedShelters.filter((s) => s.status === 'open');
    approvedShelters.forEach((s) => {
        capacity += s.totalCapacity || 0;
        occupancy += s.currentOccupancy || 0;
    });

    return {
        verifiedIncidents,
        incidents24h,
        pendingIncidents,
        openRequests,
        openShelterCount: openShelters.length,
        shelterBedsLeft: Math.max(0, capacity - occupancy),
        occupancy,
        capacity,
        activeVolunteers,
        activeAssignments
    };
}

async function publicFeed(limit = 40) {
    const incidents = await Incident.find({ status: 'verified' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title category verifiedSeverity selfReportedSeverity address location status createdAt');
    const shelters = await Shelter.find({
        verificationStatus: 'approved',
        status: { $in: ['open', 'full'] }
    }).select('name address status totalCapacity currentOccupancy location amenities hostType');

    return {
        generatedAt: new Date().toISOString(),
        incidents: incidents.map((i) => ({
            id: i._id,
            title: i.title,
            category: i.category,
            severity: i.verifiedSeverity || i.selfReportedSeverity,
            address: i.address,
            coordinates: i.location && i.location.coordinates,
            reportedAt: i.createdAt
        })),
        shelters: shelters.map((s) => ({
            id: s._id,
            name: s.name,
            address: s.address,
            status: s.status,
            capacity: s.totalCapacity,
            occupancy: s.currentOccupancy,
            bedsLeft: Math.max(0, s.totalCapacity - s.currentOccupancy),
            coordinates: s.location && s.location.coordinates,
            amenities: s.amenities,
            hostType: s.hostType
        }))
    };
}

function incidentPopups(incidents) {
    return incidents.map((i) => ({
        coordinates: i.location.coordinates,
        popupMarkup: `<b>${escapeHtml(i.title)}</b><br>${escapeHtml(i.verifiedSeverity || i.selfReportedSeverity || '')}<br><a href="/incidents/${i._id}">Open</a>`
    }));
}

function shelterPopups(shelters) {
    return shelters.map((s) => ({
        coordinates: s.location.coordinates,
        popupMarkup: `<b>${escapeHtml(s.name)}</b><br>${s.currentOccupancy}/${s.totalCapacity}<br><a href="/shelters/${s._id}">Open</a>`
    }));
}

module.exports = { opsSnapshot, publicFeed, incidentPopups, shelterPopups };
