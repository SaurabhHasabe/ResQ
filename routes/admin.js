const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin } = require('../middleware');
const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Request = require('../models/request');
const Assignment = require('../models/assignment');
const User = require('../models/user');

// RULE-BASED PRIORITY SCORING
function calculateScore(incident, allPendingIncidents) {
    let score = 0;

    // Category weight
    const categoryWeights = {
        'building collapse': 50,
        'fire': 40,
        'earthquake': 30,
        'flood': 20,
        'other': 10
    };
    score += (categoryWeights[incident.category] || 10);

    // Severity weight
    const severityWeights = { 'high': 30, 'medium': 15, 'low': 5 };
    score += (severityWeights[incident.selfReportedSeverity] || 5);

    // Density
    let nearbyCount = 0;
    for (let other of allPendingIncidents) {
        if (other._id.toString() === incident._id.toString()) continue;
        const [lon1, lat1] = incident.location.coordinates;
        const [lon2, lat2] = other.location.coordinates;
        const dist = Math.sqrt(Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2));
        if (dist < 0.02) nearbyCount++;
    }
    score += (nearbyCount * 5);

    return score;
}

router.get('/dashboard', isLoggedIn, isAdmin, catchAsync(async (req, res) => {
    let pendingIncidentsDocs = await Incident.find({ status: 'pending' });
    let pendingIncidents = pendingIncidentsDocs.map(doc => doc.toObject());
    
    // Compute suggested scores
    pendingIncidents.forEach(inc => {
        inc.suggestedScore = calculateScore(inc, pendingIncidents);
    });
    // Sort pending by suggested score desc
    pendingIncidents.sort((a, b) => b.suggestedScore - a.suggestedScore);

    const verifiedIncidents = await Incident.countDocuments({ status: 'verified' });
    const openRequests = await Request.countDocuments({ status: 'open' });

    const shelters = await Shelter.find({});
    let totalCapacity = 0;
    let totalOccupancy = 0;
    shelters.forEach(s => {
        totalCapacity += s.totalCapacity;
        totalOccupancy += s.currentOccupancy;
    });

    const unassignedTasks = openRequests + pendingIncidentsDocs.length; // rough stat
    const volunteers = await User.find({ role: 'volunteer' });

    res.render('dashboard/admin', {
        pendingIncidents,
        verifiedIncidents,
        openRequests,
        totalCapacity,
        totalOccupancy,
        unassignedTasks,
        volunteers
    });
}));

router.post('/incidents/:id/verify', isLoggedIn, isAdmin, catchAsync(async (req, res) => {
    const { status, verifiedSeverity, priorityScore } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
        req.flash('error', 'Incident not found');
        return res.redirect('/admin/dashboard');
    }
    incident.status = status;
    if (status === 'verified') {
        incident.verifiedSeverity = verifiedSeverity;
        incident.priorityScore = priorityScore ? Number(priorityScore) : null;
        incident.verifiedBy = req.user._id;
        incident.verifiedAt = new Date();
    }
    await incident.save();
    req.flash('success', `Incident marked as ${status}`);
    res.redirect('/admin/dashboard');
}));

router.post('/assign', isLoggedIn, isAdmin, catchAsync(async (req, res) => {
    const { volunteerId, targetType, targetId } = req.body;
    const assignment = new Assignment({
        volunteer: volunteerId,
        targetType,
        targetId,
        assignedBy: req.user._id
    });
    await assignment.save();

    if (targetType === 'request') {
        await Request.findByIdAndUpdate(targetId, { status: 'assigned' });
    }

    req.flash('success', 'Successfully assigned task to volunteer');
    const referer = req.get('Referer') || '/admin/dashboard';
    res.redirect(referer);
}));

module.exports = router;
