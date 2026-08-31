module.exports.sampleIncidents = [
    {
        title: "Main Street Flood",
        description: "Heavy rainfall has flooded the main street near the downtown area. Several cars are stuck.",
        category: "flood",
        selfReportedSeverity: "high",
        address: "123 Main St, Springfield",
        latitude: 39.7817,
        longitude: -89.6501
    },
    {
        title: "Apartment Fire",
        description: "Smoke seen coming from the third floor of the Oakwood apartment complex.",
        category: "fire",
        selfReportedSeverity: "high",
        address: "456 Oakwood Dr, Springfield",
        latitude: 39.7850,
        longitude: -89.6450
    },
    {
        title: "Fallen Tree on Road",
        description: "A large oak tree has fallen across Elm Street blocking traffic completely.",
        category: "other",
        selfReportedSeverity: "medium",
        address: "789 Elm St, Springfield",
        latitude: 39.7900,
        longitude: -89.6550
    }
];

module.exports.sampleShelters = [
    {
        name: "Springfield High School Gym",
        totalCapacity: 200,
        currentOccupancy: 45,
        status: "open",
        address: "101 School House Rd, Springfield",
        latitude: 39.7750,
        longitude: -89.6600
    },
    {
        name: "Community Center",
        totalCapacity: 100,
        currentOccupancy: 100,
        status: "full",
        address: "202 Rec Path, Springfield",
        latitude: 39.7800,
        longitude: -89.6400
    }
];

module.exports.sampleRequests = [
    {
        type: "medical",
        description: "Need first aid kit and bandages for minor cuts.",
        urgency: "medium",
        address: "123 Main St, Springfield",
        latitude: 39.7817,
        longitude: -89.6501
    },
    {
        type: "rescue",
        description: "Trapped on the second floor due to rising water.",
        urgency: "high",
        address: "125 Main St, Springfield",
        latitude: 39.7820,
        longitude: -89.6503
    }
];
