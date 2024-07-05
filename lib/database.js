'use strict';

const opentelemetry = require('@opentelemetry/api');
const tracer = opentelemetry.trace.getTracer('mongodb-tracer');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config');
var _db;

function Database() {
    this.connect = function(app, callback) {
        const span = tracer.startSpan('connect-to-mongodb');
        span.addEvent('Getting MongoDB');
        span.setAttribute('db.name',db.name);
        span.setAttribute('db.system',db.system);
        MongoClient.connect(config.database.url, config.database.options, function (err, db) {
            if (err) {
                span.recordException(err);
                console.log('Error connecting to MongoDB:', err);
            } else {
                _db = db;
                app.locals.db = db;
                console.log('Connected to MongoDB');
            }
            span.end();
            console.log('Ending span for MongoDB connection');
            callback(err);
        });
    }

    this.getDb = function(app, callback) {
        const tracer = trace.getTracer('mongodb-tracer');
        const span = tracer.startSpan('get-mongodb-instance');
        console.log('Starting span for getting MongoDB instance');

        if (!_db) {
            this.connect(app, function(err) {
                if (err) {
                    span.recordException(err);
                    console.log('Failed to connect to database server');
                } else {
                    console.log('Connected to database server successfully');
                }
                span.end();
                console.log('Ending span for getting MongoDB instance');
                callback(err, _db);
            });
        } else {
            console.log('Using existing MongoDB connection');
            span.end();
            callback(null, _db);
        }
    }
}

module.exports = new Database();
