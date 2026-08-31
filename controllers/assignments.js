const Assignment = require('../models/assignment');
const User = require('../models/user');
const Incident = require('../models/incident');
const Request = require('../models/request');

module.exports.index = async (req, res) => {
    // Show tasks for the logged in volunteer or all for admin
    const filter = req.user.role === 'admin' ? {} : { volunteer: req.user._id };
    const assignments = await Assignment.find(filter)
        .populate('volunteer')
        .populate('targetId');
    res.render('assignments/index', { assignments });
};

module.exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, fieldNotes } = req.body;
    const assignment = await Assignment.findById(id);

    if (req.user.role !== 'admin' && !assignment.volunteer.equals(req.user._id)) {
        req.flash('error', 'Not permitted.');
        return res.redirect('/assignments');
    }

    assignment.status = status;
    if (fieldNotes) {
        assignment.fieldNotes = fieldNotes;
    }
    await assignment.save();

    // Auto-update incident/request if assignment is resolved
    if (status === 'resolved') {
        const Model = assignment.targetType === 'incident' ? Incident : Request;
        const target = await Model.findById(assignment.targetId);
        if (target) {
            target.status = 'resolved';
            await target.save();
        }
    }

    req.flash('success', 'Assignment updated successfully.');
    res.redirect('/assignments');
};
