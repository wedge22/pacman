#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('@splunk/otel/instrument');

// Import OpenTelemetry packages
const { NodeTracerProvider } = require('@opentelemetry/sdk-node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');
const { trace } = require('@opentelemetry/api');

// Initialize the OpenTelemetry provider
const provider = new NodeTracerProvider();

// Create a tracer
const tracer = trace.getTracer('pacman-game');

// Express setup
const express = require('express');
const app = express();
const port = 8080;

// Middleware to start a span for each request
app.use((req, res, next) => {
  const span = tracer.startSpan('http_request', {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
    },
  });
  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    span.end();
  });
  next();
});

// Example of a manually instrumented route
app.get('/', (req, res) => {
  // Start a span for the '/' route
  const span = tracer.startSpan('GET /');
  try {
    res.send('Pacman game server');
    span.setStatus({ code: 0 }); // OK
  } catch (err) {
    span.setStatus({ code: 2, message: err.message }); // Error
  } finally {
    span.end();
  }
});

app.listen(port, () => {
  console.log(`Pacman game app listening at http://localhost:${port}`);
});

var app = require('../app');
//var debug = require('debug')('pacman:server');
var http = require('http');

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
