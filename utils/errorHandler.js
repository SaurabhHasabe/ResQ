const multer = require('multer');

// Error message mapping for common HTTP status codes
const ERROR_MESSAGES = {
    400: {
        title: 'Bad Request',
        message: 'The request could not be understood. Please check your input and try again.',
        icon: 'alert-circle'
    },
    401: {
        title: 'Authentication Required',
        message: 'You need to log in to access this resource.',
        icon: 'lock'
    },
    403: {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        icon: 'shield-off'
    },
    404: {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist or has been moved.',
        icon: 'search-x'
    },
    405: {
        title: 'Method Not Allowed',
        message: 'This action is not permitted for this resource.',
        icon: 'ban'
    },
    408: {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        icon: 'clock'
    },
    409: {
        title: 'Conflict',
        message: 'This action conflicts with an existing resource.',
        icon: 'alert-triangle'
    },
    413: {
        title: 'File Too Large',
        message: 'The uploaded file exceeds the maximum allowed size.',
        icon: 'file-x'
    },
    422: {
        title: 'Validation Failed',
        message: 'The provided data is invalid. Please check your input.',
        icon: 'alert-circle'
    },
    429: {
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment and try again.',
        icon: 'timer'
    },
    500: {
        title: 'Server Error',
        message: 'Something went wrong on our end. Our team has been notified.',
        icon: 'server-crash'
    },
    502: {
        title: 'Bad Gateway',
        message: 'We are experiencing connectivity issues. Please try again shortly.',
        icon: 'wifi-off'
    },
    503: {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        icon: 'construction'
    },
    504: {
        title: 'Gateway Timeout',
        message: 'The server took too long to respond. Please try again.',
        icon: 'clock'
    }
};

// Get friendly error details based on status code
function getErrorDetails(statusCode) {
    return ERROR_MESSAGES[statusCode] || ERROR_MESSAGES[500];
}

// Parse MongoDB duplicate key error
function friendlyMongoMessage(err) {
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return `That ${field} is already in use. Please choose a different one.`;
    }
    return null;
}

// Main error handler
module.exports = (err, req, res, next) => {
    // Prevent double error handling
    if (res.headersSent) {
        return next(err);
    }

    // Ensure res.locals are set for error page rendering
    res.locals.currentUser = res.locals.currentUser || req.user || null;
    res.locals.success = res.locals.success || [];
    res.locals.error = res.locals.error || [];
    res.locals.currentPath = res.locals.currentPath || '';
    res.locals.csrfToken = res.locals.csrfToken || '';
    res.locals.formAction = res.locals.formAction || ((url) => url);

    // ─── Handle Specific Error Types ───────────────────────────────────────

    // CSRF Token Error
    if (err.code === 'EBADCSRFTOKEN') {
        req.flash('error', 'Your session expired. Please refresh the page and try again.');
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    // Multer File Upload Errors
    if (err instanceof multer.MulterError) {
        const multerMessages = {
            LIMIT_FILE_SIZE: 'Each file must be under 5 MB.',
            LIMIT_FILE_COUNT: 'You can upload at most 5 files.',
            LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
            LIMIT_PART_COUNT: 'Too many form fields.',
            LIMIT_FIELD_KEY: 'Field name is too long.',
            LIMIT_FIELD_VALUE: 'Field value is too long.',
            LIMIT_FIELD_COUNT: 'Too many fields.'
        };
        req.flash('error', multerMessages[err.code] || 'File upload failed. Please try again.');
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    // Custom file validation error (from middleware)
    if (err.message === 'Only JPEG, PNG, or WebP images are allowed.') {
        req.flash('error', err.message);
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    // MongoDB CastError (Invalid ObjectId)
    if (err.name === 'CastError') {
        req.flash('error', 'The requested resource could not be found. Invalid ID.');
        return res.redirect('/');
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        const userMessage = messages.length > 1
            ? `Please correct the following: ${messages.join(', ')}`
            : messages[0];
        req.flash('error', userMessage);
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    // MongoDB Duplicate Key Error
    const mongoMsg = friendlyMongoMessage(err);
    if (mongoMsg) {
        req.flash('error', mongoMsg);
        return res.redirect(req.get('Referrer') || req.get('Referer') || '/');
    }

    // Passport Authentication Errors
    if (err.name === 'AuthenticationError' || err.message.includes('password')) {
        req.flash('error', 'Invalid username or password.');
        return res.redirect('/login');
    }

    // ─── Determine Status Code ─────────────────────────────────────────────

    let statusCode = err.statusCode || err.status || 500;

    // Normalize status codes
    if (statusCode < 100 || statusCode >= 600) {
        statusCode = 500;
    }

    // ─── Logging ───────────────────────────────────────────────────────────

    const isProd = process.env.NODE_ENV === 'production';

    if (statusCode >= 500) {
        // Log server errors
        if (isProd) {
            console.error(`[${new Date().toISOString()}] ${statusCode} Error:`, err.message);
        } else {
            console.error(`[${new Date().toISOString()}] ${statusCode} Error:`, err);
        }
    } else if (statusCode >= 400 && !isProd) {
        // Log client errors in development only
        console.warn(`[${new Date().toISOString()}] ${statusCode} Client Error:`, err.message);
    }

    // ─── Prepare Error Response ────────────────────────────────────────────

    const errorDetails = getErrorDetails(statusCode);

    // Use custom error message if provided, otherwise use default
    const displayMessage = (statusCode >= 500 && isProd)
        ? errorDetails.message  // Generic message for production server errors
        : (err.message || errorDetails.message);

    const errorData = {
        statusCode,
        title: errorDetails.title,
        message: displayMessage,
        icon: errorDetails.icon,
        stack: isProd ? null : err.stack,
        showRetry: statusCode >= 500 || statusCode === 408 || statusCode === 429,
        showHome: statusCode === 404 || statusCode === 403,
        showLogin: statusCode === 401
    };

    // ─── Send Response ─────────────────────────────────────────────────────

    res.status(statusCode).render('error', { err: errorData });
};
