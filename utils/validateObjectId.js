const mongoose = require('mongoose');
const ExpressError = require('./ExpressError');

module.exports = (req, res, next) => {
    if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        req.flash('error', 'Invalid ID format.');
        return res.redirect('back');
    }
    next();
};
