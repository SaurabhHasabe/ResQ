const Shelter = require('../models/shelter');

function pointFromBody(shelter) {
    return {
        type: 'Point',
        coordinates: [Number(shelter.longitude), Number(shelter.latitude)]
    };
}

module.exports.index = async (req, res) => {
    const shelters = await Shelter.find({});
    res.render('shelters/index', { shelters });
};

module.exports.renderNewForm = (req, res) => {
    res.render('shelters/new');
};

module.exports.createShelter = async (req, res) => {
    const { name, address, totalCapacity, currentOccupancy, status } = req.body.shelter;
    const shelter = new Shelter({
        name,
        address,
        totalCapacity,
        currentOccupancy,
        status,
        location: pointFromBody(req.body.shelter),
        managedBy: req.user._id
    });
    await shelter.save();
    req.flash('success', 'Successfully added a new shelter!');
    res.redirect(`/shelters/${shelter._id}`);
};

module.exports.showShelter = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id).populate('managedBy');
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    res.render('shelters/show', { shelter });
};

module.exports.renderEditForm = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    res.render('shelters/edit', { shelter });
};

module.exports.updateShelter = async (req, res) => {
    const { id } = req.params;
    const shelter = await Shelter.findById(id);
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    const { name, address, totalCapacity, currentOccupancy, status } = req.body.shelter;
    shelter.name = name;
    shelter.address = address;
    shelter.totalCapacity = totalCapacity;
    shelter.currentOccupancy = currentOccupancy;
    shelter.status = status;
    shelter.location = pointFromBody(req.body.shelter);
    await shelter.save();
    req.flash('success', 'Successfully updated shelter!');
    res.redirect(`/shelters/${shelter._id}`);
};

module.exports.deleteShelter = async (req, res) => {
    const { id } = req.params;
    const shelter = await Shelter.findByIdAndDelete(id);
    if (!shelter) {
        req.flash('error', 'Cannot find that shelter!');
        return res.redirect('/shelters');
    }
    req.flash('success', 'Successfully deleted shelter');
    res.redirect('/shelters');
};
