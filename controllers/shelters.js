const Shelter = require('../models/shelter');
const { notifyAdmins, notifyUser } = require('../utils/notify');
const { audit } = require('../utils/audit');

function pointFromBody(shelter) {
    return {
        type: 'Point',
        coordinates: [Number(shelter.longitude), Number(shelter.latitude)]
    };
}

function amenitiesFrom(shelter) {
    return [].concat(shelter.amenities || []).filter(Boolean);
}

function canViewShelter(user, shelter) {
    if (shelter.verificationStatus === 'approved') return true;
    if (!user) return false;
    if (user.role === 'admin') return true;
    return shelter.managedBy && shelter.managedBy.equals(user._id);
}

module.exports.index = async (req, res) => {
    const filter = { verificationStatus: 'approved' };
    if (req.user) {
        if (req.user.role === 'admin') {
            filter.verificationStatus = { $in: ['pending', 'approved', 'rejected'] };
        } else {
            filter.$or = [
                { verificationStatus: 'approved' },
                { managedBy: req.user._id }
            ];
            delete filter.verificationStatus;
        }
    }
    const shelters = await Shelter.find(filter).sort({ createdAt: -1 });
    res.render('shelters/index', { shelters });
};

module.exports.renderNewForm = (req, res) => {
    res.render('shelters/new');
};

module.exports.createShelter = async (req, res) => {
    const body = req.body.shelter;
    const isAdmin = req.user.role === 'admin';
    const shelter = new Shelter({
        name: body.name,
        address: body.address,
        totalCapacity: body.totalCapacity,
        currentOccupancy: body.currentOccupancy || 0,
        status: body.status || 'open',
        contactPhone: body.contactPhone || req.user.phone || '',
        notes: body.notes || '',
        amenities: amenitiesFrom(body),
        location: pointFromBody(body),
        managedBy: req.user._id,
        hostType: isAdmin ? 'official' : 'community',
        verificationStatus: isAdmin ? 'approved' : 'pending'
    });
    await shelter.save();
    await audit({
        actor: req.user._id,
        action: isAdmin ? 'shelter.published' : 'shelter.submitted',
        targetType: 'shelter',
        targetId: shelter._id,
        summary: `${req.user.username} listed shelter "${shelter.name}"`
    });
    if (!isAdmin) {
        await notifyAdmins({
            title: 'Community shelter awaiting verification',
            body: `${shelter.name} — ${shelter.address}`,
            href: `/shelters/${shelter._id}`,
            kind: 'shelter'
        });
    }
    req.flash('success', isAdmin
        ? 'Shelter published.'
        : 'Shelter submitted. It will appear publicly after an admin verifies it.');
    res.redirect(`/shelters/${shelter._id}`);
};

module.exports.showShelter = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id).populate('managedBy');
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    if (!canViewShelter(req.user, shelter)) {
        req.flash('error', 'This shelter is awaiting verification.');
        return res.redirect('/shelters');
    }
    res.render('shelters/show', { shelter });
};

module.exports.renderEditForm = async (req, res) => {
    const shelter = req.shelter || await Shelter.findById(req.params.id);
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    res.render('shelters/edit', { shelter });
};

module.exports.updateShelter = async (req, res) => {
    const shelter = req.shelter || await Shelter.findById(req.params.id);
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    const body = req.body.shelter;
    shelter.name = body.name;
    shelter.address = body.address;
    shelter.totalCapacity = body.totalCapacity;
    shelter.currentOccupancy = body.currentOccupancy;
    shelter.status = body.status;
    shelter.contactPhone = body.contactPhone || '';
    shelter.notes = body.notes || '';
    shelter.amenities = amenitiesFrom(body);
    shelter.location = pointFromBody(body);
    await shelter.save();
    req.flash('success', 'Shelter updated.');
    res.redirect(`/shelters/${shelter._id}`);
};

module.exports.deleteShelter = async (req, res) => {
    const deleted = await Shelter.findByIdAndDelete(req.params.id);
    if (!deleted) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    req.flash('success', 'Shelter removed.');
    res.redirect('/shelters');
};

module.exports.review = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter || shelter.verificationStatus !== 'pending') {
        req.flash('error', 'That shelter is no longer pending review.');
        return res.redirect('/admin/dashboard');
    }
    const { status } = req.body;
    shelter.verificationStatus = status;
    shelter.reviewedBy = req.user._id;
    shelter.reviewedAt = new Date();
    if (status === 'rejected') shelter.status = 'closed';
    await shelter.save();
    if (shelter.managedBy) {
        await notifyUser(shelter.managedBy, {
            title: status === 'approved' ? 'Your shelter is live' : 'Shelter listing was not approved',
            body: shelter.name,
            href: `/shelters/${shelter._id}`,
            kind: 'shelter'
        });
    }
    await audit({
        actor: req.user._id,
        action: `shelter.${status}`,
        targetType: 'shelter',
        targetId: shelter._id,
        summary: `${req.user.username} ${status} shelter "${shelter.name}"`
    });
    req.flash('success', status === 'approved' ? 'Community shelter approved.' : 'Shelter listing declined.');
    res.redirect('/admin/dashboard');
};
