import SplunkOtelWeb from 'https://unpkg.com/@splunk/otel-web@0.19.0/dist/index.js';

SplunkOtelWeb.init({ 
    realm: "us1", 
    rumAccessToken: "bRa9gAn966GFzFeIIgw0rg", 
    applicationName: "ksh-pacman", 
    deploymentEnvironment: "lab" 
});