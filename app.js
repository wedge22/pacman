'use strict';

var express = require('express');
var path = require('path');
var rateLimit = require('express-rate-limit');
var helmet = require('helmet');
var Database = require('./lib/database');

// Constants

// Routes
var highscores = require('./routes/highscores');
var user = require('./routes/user');
var loc = require('./routes/location');
var config = require('./routes/config');

// App
var app = express();

// Security headers middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.signalfx.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body parser middleware (built into Express 4.16+)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const postLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 POST requests per windowMs
    message: 'Too many submissions from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/user', apiLimiter);
app.use('/location', apiLimiter);
app.use('/config', apiLimiter);

// Apply stricter rate limiting to POST endpoints
app.use('/highscores', postLimiter);
app.use('/user/stats', postLimiter);

// Serve static files from the root directory 
app.use(express.static(path.join(__dirname))); 

// Handle root web server's public directory
app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/highscores', highscores);
app.use('/user', user);
app.use('/location', loc);
app.use('/config', config);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Centralized Error Handler
app.use(function(err, req, res, next) {
    // If headers already sent, delegate to Express default error handler
    if (res.headersSent) {
        return next(err);
    }

    // Log error details for debugging
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Set locals, only providing error details in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Determine status code
    const status = err.status || err.statusCode || 500;
    
    // For API routes, send JSON response
    if (req.path.startsWith('/highscores') || 
        req.path.startsWith('/user') || 
        req.path.startsWith('/location') ||
        req.path.startsWith('/config')) {
        return res.status(status).json({
            rs: 'error',
            message: status === 500 ? 'Internal server error' : err.message,
            ...(req.app.get('env') === 'development' && { stack: err.stack })
        });
    }

    // For web routes, render error page
    res.status(status);
    res.render('error');
});

Database.connect(app, function(err) {
    if (err) {
        console.log('Failed to connect to database server');
    } else {
        console.log('Connected to database server successfully');
    }

});

module.exports = app;