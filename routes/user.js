var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;
var Database = require('../lib/database');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
    console.log('Time: ', Date());
    next();
})

router.get('/id', function(req, res, next) {
    console.log('[GET /user/id]');
    Database.getDb(req.app, function(err, db) {
        if (err) {
            return next(err);
        }

        // Insert user ID and return back generated ObjectId
        var userId = 0;
        db.collection('userstats').insertOne({
            date: Date()
        }, {
           writeConcern: {
               w: 'majority',
               j: true,
               wtimeout: 10000
           }
        }, function(err, result) {
           if (err) {
               console.log('failed to insert new user ID err =', err);
           } else {
               userId = result.insertedId;
               console.log('Successfully inserted new user ID = ', userId);
           }

           res.json(userId);
        });
    });

});

// Validation helper function
function sanitizeString(str, maxLength) {
    if (typeof str !== 'string') return '';
    // Remove any HTML/script tags and trim
    return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLength);
}

router.post('/stats', function(req, res, next) {
    console.log('[POST /user/stats]\n',
                ' body =', req.body, '\n',
                ' host =', req.headers.host,
                ' user-agent =', req.headers['user-agent'],
                ' referer =', req.headers.referer);

    // Validate required fields
    if (!req.body.userId) {
        return res.status(400).json({
            rs: 'error',
            message: 'Missing required field: userId'
        });
    }

    // Validate MongoDB ObjectId format
    if (!ObjectId.isValid(req.body.userId)) {
        return res.status(400).json({
            rs: 'error',
            message: 'Invalid userId format'
        });
    }

    // Validate and parse numeric fields
    var userScore = parseInt(req.body.score, 10);
    if (isNaN(userScore) || userScore < 0 || userScore > 99999999) {
        return res.status(400).json({
            rs: 'error',
            message: 'Score must be a valid number between 0 and 99999999'
        });
    }

    var userLevel = parseInt(req.body.level, 10);
    if (isNaN(userLevel) || userLevel < 1 || userLevel > 999) {
        return res.status(400).json({
            rs: 'error',
            message: 'Level must be a valid number between 1 and 999'
        });
    }

    var userLives = parseInt(req.body.lives, 10);
    if (isNaN(userLives) || userLives < 0 || userLives > 99) {
        return res.status(400).json({
            rs: 'error',
            message: 'Lives must be a valid number between 0 and 99'
        });
    }

    var userET = parseInt(req.body.elapsedTime, 10);
    if (isNaN(userET) || userET < 0 || userET > 86400) {
        return res.status(400).json({
            rs: 'error',
            message: 'Elapsed time must be a valid number between 0 and 86400 seconds'
        });
    }

    // Sanitize optional cloud metadata fields
    var cloud = sanitizeString(req.body.cloud || 'unknown', 100);
    var zone = sanitizeString(req.body.zone || 'unknown', 100);
    var host = sanitizeString(req.body.host || 'unknown', 255);

    Database.getDb(req.app, function(err, db) {
        if (err) {
            return next(err);
        }

        // Update live user stats
        db.collection('userstats').updateOne({
                _id: new ObjectId(req.body.userId),
            }, { $set: {
                    cloud: cloud,
                    zone: zone,
                    host: host,
                    score: userScore,
                    level: userLevel,
                    lives: userLives,
                    elapsedTime: userET,
                    date: Date(),
                    referer: req.headers.referer || '',
                    user_agent: req.headers['user-agent'] || '',
                    hostname: req.hostname,
                    ip_addr: req.ip
               }, $inc: {
                    updateCounter: 1
               }
            }, {
                writeConcern: {
                    w: 'majority',
                    j: true,
                    wtimeout: 10000
                }
            }, function(err, result) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        rs: 'error',
                        message: 'Failed to update user stats'
                    });
                }

                console.log('Successfully updated user stats');
                res.json({
                    rs: 'success'
                });
        });
    });
});

router.get('/stats', function(req, res, next) {
    console.log('[GET /user/stats]');

    Database.getDb(req.app, function(err, db) {
        if (err) {
            return next(err);
        }

        // Find all elements where the score field exists to avoid
        // undefined values
        var col = db.collection('userstats');
        col.find({ score: {$exists: true}}).sort([['_id', 1]]).toArray(function(err, docs) {
            var result = [];
            if (err) {
                console.log(err);
            }

            docs.forEach(function(item, index, array) {
                result.push({
                                cloud: item['cloud'],
                                zone: item['zone'],
                                host: item['host'],
                                score: item['score'],
                                level: item['level'],
                                lives: item['lives'],
                                et: item['elapsedTime'],
                                txncount: item['updateCounter']
                });
            });

            res.json(result);
        });
    });
});


module.exports = router;
