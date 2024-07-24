import SplunkOtelWeb from 'https://cdn.signalfx.com/o11y-gdi-rum/0.19.0/splunk-otel-web.js';

SplunkOtelWeb.init({ 
    realm: "us1", 
    rumAccessToken: "bRa9gAn966GFzFeIIgw0rg", 
    applicationName: "ksh-pacman", 
    deploymentEnvironment: "lab" 
});