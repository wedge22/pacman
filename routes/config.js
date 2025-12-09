var express = require('express');
var router = express.Router();

// Serve client configuration
router.get('/client', function(req, res) {
    res.json({
        splunkRum: {
            realm: process.env.SPLUNK_RUM_REALM || 'us1',
            rumAccessToken: process.env.SPLUNK_RUM_TOKEN || '',
            applicationName: process.env.SPLUNK_RUM_APP_NAME || 'pacman',
            version: process.env.APP_VERSION || '1.0',
            deploymentEnvironment: process.env.DEPLOYMENT_ENV || 'development'
        }
    });
});

module.exports = router;
