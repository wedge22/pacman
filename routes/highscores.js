var express = require('express');
var router = express.Router();
var Database = require('../lib/database');

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
    console.log('Time: ', Date());
    next();
})

router.get('/list', function(req, res, next) {
    console.log('[GET /highscores/list]');
    Database.getDb(req.app, function(err, db) {
        if (err) {
            return next(err);
        }

        // Retrieve the top 10 high scores
        var col = db.collection('highscore');
        col.find({}).sort([['score', -1]]).limit(10).toArray(function(err, docs) {
            var result = [];
            if (err) {
                console.log(err);
            }

            docs.forEach(function(item, index, array) {
                result.push({ name: item['name'], cloud: item['cloud'],
                              zone: item['zone'], host: item['host'],
                              score: item['score'] });
            });

            res.json(result);
        });
    });
});

// Validation helper function
function sanitizeString(str, maxLength) {
    if (typeof str !== 'string') return '';
    // Remove any HTML/script tags and trim
    return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLength);
}

// Accessed at /highscores
router.post('/', function(req, res, next) {
    console.log('[POST /highscores] body =', req.body,
                ' host =', req.headers.host,
                ' user-agent =', req.headers['user-agent'],
                ' referer =', req.headers.referer);

    // Validate required fields
    if (!req.body.name || !req.body.score || !req.body.level) {
        return res.status(400).json({
            rs: 'error',
            message: 'Missing required fields: name, score, and level are required'
        });
    }

    // Sanitize and validate name
    var name = sanitizeString(req.body.name, 50);
    if (name.length === 0 || name.length > 50) {
        return res.status(400).json({
            rs: 'error',
            message: 'Name must be between 1 and 50 characters'
        });
    }

    // Validate and parse score
    var userScore = parseInt(req.body.score, 10);
    if (isNaN(userScore) || userScore < 0 || userScore > 99999999) {
        return res.status(400).json({
            rs: 'error',
            message: 'Score must be a valid number between 0 and 99999999'
        });
    }

    // Validate and parse level
    var userLevel = parseInt(req.body.level, 10);
    if (isNaN(userLevel) || userLevel < 1 || userLevel > 999) {
        return res.status(400).json({
            rs: 'error',
            message: 'Level must be a valid number between 1 and 999'
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

        // Insert high score with extra user data
        db.collection('highscore').insertOne({
                name: name,
                cloud: cloud,
                zone: zone,
                host: host,
                score: userScore,
                level: userLevel,
                date: new Date(),
                referer: req.headers.referer || '',
                user_agent: req.headers['user-agent'] || '',
                hostname: req.hostname,
                ip_addr: req.ip
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
                        message: 'Failed to save highscore'
                    });
                }

                console.log('Successfully inserted highscore');
                res.json({
                    name: name,
                    zone: zone,
                    score: userScore,
                    level: userLevel,
                    rs: 'success'
                });
            });
    });
});

module.exports = router;
