import { trace } from '@opentelemetry/api';
import { start } from '@splunk/otel';

start({
    serviceName: 'ksh-pacman',
});

window.tracer = trace.getTracer('appModuleLoader');