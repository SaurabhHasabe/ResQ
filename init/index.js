const mongoose = require('mongoose');
const User = require('../models/user');
const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Request = require('../models/request');
const Assignment = require('../models/assignment');
const { sampleIncidents, sampleShelters, sampleRequests } = require('./data');

const dbUrl = 'mongodb://127.0.0.1:27017/resq';
mongoose.connect(dbUrl)
    .then(() => console.log('MONGO CONNECTION OPEN!!!'))
    .catch(err => console.log('MONGO CONNECTION ERROR!!!!', err));

const seedDB = async () => {
    // Clear all collections
    await User.deleteMany({});
    await Incident.deleteMany({});
    await Shelter.deleteMany({});
    await Request.deleteMany({});
    await Assignment.deleteMany({});

    // 1. Create Users
    const admin = new User({ email: 'admin@resq.com', username: 'admin', role: 'admin' });
    const volunteer = new User({ email: 'vol@resq.com', username: 'volunteer1', role: 'volunteer' });
    const citizen = new User({ email: 'cit@resq.com', username: 'citizen1', role: 'citizen' });

    await User.register(admin, 'password');
    const volRecord = await User.register(volunteer, 'password');
    const citRecord = await User.register(citizen, 'password');
    console.log('Users created.');

    // 2. Create Incidents
    for (let incData of sampleIncidents) {
        const { latitude, longitude, ...rest } = incData;
        const incident = new Incident({
            ...rest,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // GeoJSON is [lng, lat]
            },
            status: rest.category === 'flood' ? 'verified' : 'pending',
            verifiedSeverity: rest.category === 'flood' ? rest.selfReportedSeverity : null,
            reportedBy: citRecord._id,
            verifiedBy: rest.category === 'flood' ? admin._id : null
        });
        await incident.save();
    }
    console.log('Incidents created.');

    // 3. Create Shelters
    for (let shData of sampleShelters) {
        const { latitude, longitude, ...rest } = shData;
        const shelter = new Shelter({
            ...rest,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            managedBy: admin._id
        });
        await shelter.save();
    }
    console.log('Shelters created.');

    // 4. Create Requests
    for (let reqData of sampleRequests) {
        const { latitude, longitude, ...rest } = reqData;
        const request = new Request({
            ...rest,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            requestedBy: citRecord._id
        });
        await request.save();
    }
    console.log('Requests created.');
};

seedDB().then(() => {
    mongoose.connection.close();
    console.log('Seeding finished, connection closed.');
});
