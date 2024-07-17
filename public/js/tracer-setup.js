(function() {
    const { trace } = require('@opentelemetry/api');
    const { start } = require('@splunk/otel');

    start({
        serviceName: 'ksh-pacman',
    });

    window.tracer = trace.getTracer('appModuleLoader');
})();