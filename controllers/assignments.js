const Assignment = require('../models/assignment');
const Incident = require('../models/incident');
const Request = require('../models/request');

async function populateTargets(assignments) {
    await Promise.all(assignments.map(async (a) => {
        const Model = a.targetType === 'incident' ? Incident : Request;
        a.targetId = await Model.findById(a.targetId);
    }));
}

module.exports.index = async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { volunteer: req.user._id };
    const assignments = await Assignment.find(filter).populate('volunteer');
    await populateTargets(assignments);
    res.render('assignments/index', { assignments });
};

module.exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, fieldNotes } = req.body;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
        req.flash('error', 'Assignment not found.');
        return res.redirect('/assignments');
    }

    if (req.user.role !== 'admin' && !assignment.volunteer.equals(req.user._id)) {
        req.flash('error', 'Not permitted.');
        return res.redirect('/assignments');
    }

    assignment.status = status;
    if (typeof fieldNotes === 'string') {
        assignment.fieldNotes = fieldNotes;
    }
    await assignment.save();

    if (status === 'resolved') {
        const Model = assignment.targetType === 'incident' ? Incident : Request;
        const target = await Model.findById(assignment.targetId);
        if (target && target.status !== 'resolved') {
            target.status = 'resolved';
            await target.save();
        }
    }

    req.flash('success', 'Assignment updated successfully.');
    res.redirect('/assignments');
};
