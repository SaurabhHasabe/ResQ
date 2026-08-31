const Shelter = require('../models/shelter');

module.exports.index = async (req, res) => {
    const shelters = await Shelter.find({});
    res.render('shelters/index', { shelters });
};

module.exports.renderNewForm = (req, res) => {
    res.render('shelters/new');
};

module.exports.createShelter = async (req, res) => {
    const geoData = {
        type: 'Point',
        coordinates: [req.body.shelter.longitude, req.body.shelter.latitude]
    };
    const shelter = new Shelter(req.body.shelter);
    shelter.location = geoData;
    shelter.managedBy = req.user._id;
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
    const geoData = {
        type: 'Point',
        coordinates: [req.body.shelter.longitude, req.body.shelter.latitude]
    };
    const shelter = await Shelter.findByIdAndUpdate(id, { ...req.body.shelter });
    shelter.location = geoData;
    await shelter.save();
    req.flash('success', 'Successfully updated shelter!');
    res.redirect(`/shelters/${shelter._id}`);
};

module.exports.deleteShelter = async (req, res) => {
    const { id } = req.params;
    await Shelter.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted shelter');
    res.redirect('/shelters');
};
