if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const User = require('../models/user');
const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Request = require('../models/request');
const Assignment = require('../models/assignment');
const { sampleIncidents, sampleShelters, sampleRequests } = require('./data');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/resq';

const seedDB = async () => {
    await mongoose.connect(dbUrl);
    console.log('MONGO CONNECTION OPEN!!!');

    await User.deleteMany({});
    await Incident.deleteMany({});
    await Shelter.deleteMany({});
    await Request.deleteMany({});
    await Assignment.deleteMany({});

    const admin = new User({ email: 'admin@resq.com', username: 'admin', phone: '9876543210', role: 'admin' });
    const volunteer = new User({ email: 'vol@resq.com', username: 'volunteer1', phone: '9876543211', role: 'volunteer' });
    const citizen = new User({ email: 'cit@resq.com', username: 'citizen1', phone: '9876543212', role: 'citizen' });

    await User.register(admin, 'password');
    const volRecord = await User.register(volunteer, 'password');
    const citRecord = await User.register(citizen, 'password');
    console.log('Users created: admin / volunteer1 / citizen1 (password: password)');

    for (const incData of sampleIncidents) {
        const { latitude, longitude, ...rest } = incData;
        const incident = new Incident({
            ...rest,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            status: rest.category === 'flood' ? 'verified' : 'pending',
            verifiedSeverity: rest.category === 'flood' ? rest.selfReportedSeverity : null,
            reportedBy: citRecord._id,
            verifiedBy: rest.category === 'flood' ? admin._id : null,
            verifiedAt: rest.category === 'flood' ? new Date() : null
        });
        await incident.save();
    }
    console.log('Incidents created.');

    for (const shData of sampleShelters) {
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

    for (const reqData of sampleRequests) {
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

seedDB()
    .then(() => mongoose.connection.close())
    .then(() => console.log('Seeding finished, connection closed.'))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
