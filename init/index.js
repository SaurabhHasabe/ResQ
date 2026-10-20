if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const User = require('../models/user');
const Incident = require('../models/incident');
const Shelter = require('../models/shelter');
const Request = require('../models/request');
const Assignment = require('../models/assignment');
const VolunteerApplication = require('../models/volunteerApplication');
const { sampleUsers, sampleIncidents, sampleShelters, sampleRequests } = require('./data');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/resq';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
    if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to seed while NODE_ENV=production.');
        process.exit(1);
    }
    await mongoose.connect(dbUrl);
    console.log('✅  Connected to MongoDB:', dbUrl);

    // 1. Clear all collections
    await Promise.all([
        User.deleteMany({}),
        Incident.deleteMany({}),
        Shelter.deleteMany({}),
        Request.deleteMany({}),
        Assignment.deleteMany({}),
        VolunteerApplication.deleteMany({}),
    ]);
    console.log('🗑️   Cleared all existing data');

    const createdUsers = [];
    for (const u of sampleUsers) {
        const volunteerStatus = u.role === 'volunteer' ? 'approved' : 'none';
        const user = new User({
            username: u.username,
            email: u.email,
            phone: u.phone,
            role: u.role,
            volunteerStatus,
            lastLocation: u.lastLocation
                ? { type: 'Point', coordinates: u.lastLocation }
                : undefined,
            lastLocatedAt: u.lastLocation ? new Date() : null
        });
        await User.register(user, u.password);
        createdUsers.push(user);
        console.log(`👤  Created user: ${u.username} (${u.role})`);
    }

    const volunteers = createdUsers.filter(u => u.role === 'volunteer');
    const citizens   = createdUsers.filter(u => u.role === 'citizen');
    const operator   = volunteers[0];

    const createdIncidents = [];
    for (const inc of sampleIncidents) {
        const doc = new Incident({
            title:               inc.title,
            description:         inc.description,
            category:            inc.category,
            location:            { type: 'Point', coordinates: inc.coordinates },
            address:             inc.address,
            selfReportedSeverity: inc.selfReportedSeverity,
            verifiedSeverity:    inc.verifiedSeverity,
            priorityScore:       inc.priorityScore,
            status:              inc.status,
            reportedBy:          pick(citizens)._id,
            verifiedBy:          inc.status === 'verified' ? operator._id : null,
            verifiedAt:          inc.status === 'verified' ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
        });
        await doc.save();
        createdIncidents.push(doc);
        console.log(`🚨  Created incident: "${inc.title}"`);
    }

    // 4. Create shelters
    const createdShelters = [];
    for (const sh of sampleShelters) {
        const doc = new Shelter({
            name:             sh.name,
            address:          sh.address,
            location:         { type: 'Point', coordinates: sh.coordinates },
            totalCapacity:    sh.totalCapacity,
            currentOccupancy: sh.currentOccupancy,
            status:           sh.status,
            managedBy:        operator._id,
            hostType:         'official',
            verificationStatus: 'approved',
            amenities:        sh.amenities || ['water', 'food', 'blankets', 'washroom'],
            contactPhone:     operator.phone || '9823456781'
        });
        await doc.save();
        createdShelters.push(doc);
        console.log(`🏠  Created shelter: "${sh.name}"`);
    }

    // 5. Create requests — link first 4 to verified incidents
    const verifiedIncidents = createdIncidents.filter(i => i.status === 'verified');
    const createdRequests = [];
    for (let i = 0; i < sampleRequests.length; i++) {
        const req = sampleRequests[i];
        const doc = new Request({
            type:            req.type,
            description:     req.description,
            address:         req.address,
            location:        { type: 'Point', coordinates: req.coordinates },
            urgency:         req.urgency,
            status:          req.status,
            requestedBy:     pick(citizens)._id,
            linkedIncident:  i < 4 ? verifiedIncidents[i % verifiedIncidents.length]._id : null,
        });
        await doc.save();
        createdRequests.push(doc);
        console.log(`📋  Created request: [${req.type}] ${req.description.substring(0, 60)}...`);
    }

    // 6. Create assignments for high-priority incidents and open/assigned requests
    const assignmentTargets = [
        { targetType: 'Incident', targetId: createdIncidents[0]._id, volunteer: volunteers[0] },
        { targetType: 'Incident', targetId: createdIncidents[1]._id, volunteer: volunteers[1] },
        { targetType: 'Incident', targetId: createdIncidents[2]._id, volunteer: volunteers[2] },
        { targetType: 'Incident', targetId: createdIncidents[5]._id, volunteer: volunteers[0] },
        { targetType: 'Request',  targetId: createdRequests[0]._id,  volunteer: volunteers[1] },
        { targetType: 'Request',  targetId: createdRequests[5]._id,  volunteer: volunteers[2] },
    ];

    const assignmentStatuses = ['assigned', 'en_route', 'in_progress', 'resolved'];
    for (const t of assignmentTargets) {
        const doc = new Assignment({
            volunteer:  t.volunteer._id,
            targetType: t.targetType.toLowerCase(),
            targetId:   t.targetId,
            assignedBy: operator._id,
            status:     pick(assignmentStatuses),
            fieldNotes: 'On site with local police / NDRF. Updating as the ground situation changes.',
        });
        await doc.save();
        console.log(`📌  Created assignment: ${t.volunteer.username} → ${t.targetType}`);
    }

    const applicant = citizens[0];
    applicant.volunteerStatus = 'pending';
    await applicant.save();
    await VolunteerApplication.create({
        applicant: applicant._id,
        skills: ['logistics', 'driving'],
        availability: 'weekends',
        experience: 'Worked as a driver with BMC flood relief in Kurla after the 2005 deluge and later helped load NDRF boats in 2021 monsoon.',
        message: 'Based in Mumbai. Can take night shifts during high tide alerts.',
        status: 'pending'
    });

    const communityHost = citizens[1];
    await Shelter.create({
        name: 'Meppadi family rooms offered after Wayanad slides',
        address: 'Near GHSS Meppadi, Vythiri, Wayanad, Kerala 673577',
        location: { type: 'Point', coordinates: [76.1335, 11.5572] },
        totalCapacity: 10,
        currentOccupancy: 3,
        status: 'open',
        hostType: 'community',
        verificationStatus: 'pending',
        amenities: ['water', 'food', 'blankets', 'washroom'],
        contactPhone: communityHost.phone,
        notes: 'Two rooms on the ground floor for Chooralmala families. Women and children first. Listed by a local household, pending admin verification.',
        managedBy: communityHost._id
    });

    console.log('\n✅  Seeding complete!');
    console.log('─────────────────────────────────────────────');
    console.log(`Users      : ${createdUsers.length}  (${volunteers.length} volunteers, ${citizens.length} citizens)`);
    console.log(`Incidents  : ${createdIncidents.length}`);
    console.log(`Shelters   : ${createdShelters.length}`);
    console.log(`Requests   : ${createdRequests.length}`);
    console.log(`Assignments: ${assignmentTargets.length}`);
    console.log('─────────────────────────────────────────────');
    console.log('\nAdmin is not seeded. Register or log in with a sudo email:');
    console.log('  utkarshkumar.cs18@gmail.com');
    console.log('  saurya1729@gmail.com');
    console.log('\nDemo logins:');
    for (const u of sampleUsers) {
        console.log(`  ${u.role.padEnd(9)} | username: ${u.username.padEnd(12)} | password: ${u.password}`);
    }
};

seedDB()
    .then(() => mongoose.connection.close())
    .then(() => console.log('\nConnection closed.'))
    .catch(err => {
        console.error('❌  Seeding failed:', err);
        process.exit(1);
    });
