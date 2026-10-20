function calculateScore(incident, allPendingIncidents = []) {
    let score = 0;
    const categoryWeights = {
        'building collapse': 50,
        fire: 40,
        earthquake: 30,
        flood: 20,
        other: 10
    };
    score += (categoryWeights[incident.category] || 10);

    const severityWeights = { high: 30, medium: 15, low: 5 };
    score += (severityWeights[incident.selfReportedSeverity] || 5);

    let nearbyCount = 0;
    const coords = incident.location && incident.location.coordinates;
    if (coords) {
        for (const other of allPendingIncidents) {
            if (String(other._id) === String(incident._id)) continue;
            const otherCoords = other.location && other.location.coordinates;
            if (!otherCoords) continue;
            const dist = Math.sqrt(
                Math.pow(otherCoords[0] - coords[0], 2) + Math.pow(otherCoords[1] - coords[1], 2)
            );
            if (dist < 0.02) nearbyCount++;
        }
    }
    score += nearbyCount * 5;
    return Math.min(1000, score);
}

module.exports = { calculateScore };
