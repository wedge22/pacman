#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
//var debug = require('debug')('pacman:server');
var http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load environment variables from .env file

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Serve the index.html file with injected environment variables
 */
app.get('/', (req, res) => {
    fs.readFile(path.resolve(__dirname, '../public/index.html'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading index.html');
            return;
        }
        const injectedData = data
            .replace('<%= process.env.OTEL_REALM %>', process.env.OTEL_REALM)
            .replace('<%= process.env.OTEL_RUM_TOKEN %>', process.env.OTEL_RUM_TOKEN)
            .replace('<%= process.env.OTEL_SERVICE_NAME %>', process.env.OTEL_SERVICE_NAME)
            .replace('<%= process.env.OTEL_ENV_NAME %>', process.env.OTEL_ENV_NAME);
        res.send(injectedData);
    });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}