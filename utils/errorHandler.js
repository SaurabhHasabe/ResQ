const multer = require('multer');

function friendlyMongoMessage(err) {
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return `That ${field} is already in use.`;
    }
    return null;
}

module.exports = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.locals.currentUser = res.locals.currentUser || req.user || null;
    res.locals.success = res.locals.success || [];
    res.locals.error = res.locals.error || [];
    res.locals.currentPath = res.locals.currentPath || '';
    res.locals.csrfToken = res.locals.csrfToken || '';
    res.locals.formAction = res.locals.formAction || ((url) => url);

    if (err.code === 'EBADCSRFTOKEN') {
        req.flash('error', 'Your form expired. Please refresh the page and try again.');
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    if (err.message === 'Only JPEG, PNG, or WebP images are allowed.') {
        req.flash('error', err.message);
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    if (err instanceof multer.MulterError) {
        const messages = {
            LIMIT_FILE_SIZE: 'Each image must be under 5 MB.',
            LIMIT_FILE_COUNT: 'You can upload at most 5 images.',
            LIMIT_UNEXPECTED_FILE: 'Unexpected file field.'
        };
        req.flash('error', messages[err.code] || 'File upload failed.');
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    if (err.name === 'CastError') {
        req.flash('error', 'Invalid ID.');
        return res.redirect('/');
    }

    if (err.name === 'ValidationError') {
        const msg = Object.values(err.errors).map(e => e.message).join('. ');
        req.flash('error', msg);
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    const mongoMsg = friendlyMongoMessage(err);
    if (mongoMsg) {
        req.flash('error', mongoMsg);
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    const statusCode = err.statusCode || err.status || 500;
    if (!err.message) err.message = 'Something went wrong.';

    if (statusCode >= 500) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(err);
        } else {
            console.error(err.message);
        }
    }

    const safeErr = {
        message: statusCode >= 500 && process.env.NODE_ENV === 'production'
            ? 'Something went wrong. Please try again.'
            : err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    };

    res.status(statusCode).render('error', { err: safeErr });
};
