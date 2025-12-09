FROM node:20-alpine

LABEL maintainer="K Hargreaves"

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/location/metadata', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run container with OpenTelemetry initialization
CMD ["node", "-r", "@splunk/otel/instrument", "bin/server.js"]