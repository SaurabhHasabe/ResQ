if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const userRoutes = require('./routes/users');
const incidentRoutes = require('./routes/incidents');
const shelterRoutes = require('./routes/shelters');
const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');
const assignmentRoutes = require('./routes/assignments');

const helmet = require('helmet');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/resq';
mongoose.connect(dbUrl)
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("MONGO CONNECTION ERROR!!!!")
        console.log(err)
    });

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
// express-mongo-sanitize is incompatible with Express 5 (req.query is a getter).
// Use a manual sanitizer that only touches req.body and req.params.
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
        }
    };
    sanitize(req.body);
    sanitize(req.params);
    next();
});
app.use(helmet({ contentSecurityPolicy: false }));

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // basic CSRF protection
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentPath = req.originalUrl || null;
    next();
});

app.get('/', (req, res) => {
    res.redirect('/incidents');
});

app.use('/', userRoutes);
app.use('/incidents', incidentRoutes);
app.use('/shelters', shelterRoutes);
app.use('/requests', requestRoutes);
app.use('/admin', adminRoutes);
app.use('/assignments', assignmentRoutes);

app.use((req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    // Ensure locals are always available for the error page layout
    res.locals.currentUser = res.locals.currentUser || null;
    res.locals.success = res.locals.success || [];
    res.locals.error = res.locals.error || [];
    res.locals.currentPath = res.locals.currentPath || '';
    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});
