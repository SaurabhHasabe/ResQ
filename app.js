if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const { csrfSync } = require('csrf-sync');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const errorHandler = require('./utils/errorHandler');
const { sanitizeInput } = require('./middleware');
const routes = require('./routes');

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/resq';
const sessionSecret = process.env.SESSION_SECRET || 'thisshouldbeabettersecret!';
const port = Number(process.env.PORT) || 3000;

if (isProd) {
    if (!process.env.SESSION_SECRET || sessionSecret === 'thisshouldbeabettersecret!') {
        console.error('SESSION_SECRET must be set to a strong random value in production.');
        process.exit(1);
    }
    if (!process.env.DB_URL) {
        console.error('DB_URL must be set in production.');
        process.exit(1);
    }
}

const app = express();
if (isProd) app.set('trust proxy', 1);

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(compression());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(sanitizeInput);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com', "'unsafe-inline'"],
            styleSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com', 'https://fonts.googleapis.com', "'unsafe-inline'"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org', 'https://*.openstreetmap.org', 'https://res.cloudinary.com'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    skip: (req) => req.path === '/health'
}));

app.use(session({
    name: 'resq.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: dbUrl,
        collectionName: 'sessions',
        ttl: 60 * 60 * 24 * 7,
        touchAfter: 24 * 3600
    }),
    cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const { generateToken, csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => {
        if (req.body && typeof req.body._csrf === 'string') return req.body._csrf;
        if (req.query && typeof req.query._csrf === 'string') return req.query._csrf;
        return undefined;
    }
});

app.use((req, res, next) => {
    if (req.path === '/health') return next();
    csrfSynchronisedProtection(req, res, (err) => {
        if (err) return next(err);
        next();
    });
});

app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentPath = req.originalUrl || '';
    res.locals.csrfToken = req.path === '/health' ? '' : generateToken(req);
    res.locals.formAction = (url) => {
        const token = encodeURIComponent(res.locals.csrfToken || '');
        return url.includes('?') ? `${url}&_csrf=${token}` : `${url}?_csrf=${token}`;
    };
    next();
});

app.use(routes);

app.use((req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use(errorHandler);

async function start() {
    try {
        await mongoose.connect(dbUrl);
        console.log('MONGO CONNECTION OPEN!!!');
        app.listen(port, '0.0.0.0', () => {
            console.log(`Serving on port ${port} - http://localhost:${port}`);
        });
    } catch (err) {
        console.error('MONGO CONNECTION ERROR!!!!');
        console.error(err);
        process.exit(1);
    }
}

async function shutdown() {
    try {
        await mongoose.connection.close();
    } finally {
        process.exit(0);
    }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
