FROM node:16

LABEL maintainer="K Hargreaves"

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Clone game source code
RUN git clone https://github.com/wedge22/pacman.git .

# Install app dependencies including @splunk/otel package
RUN npm install @splunk/otel
RUN npm install @splunk/otel-web --save
RUN npm install

# Set appropriate permissions
RUN chmod -R go+r /usr/src/app/node_modules/@splunk/otel

# Copy the rest of the application code
COPY . .

# Expose port 8080
EXPOSE 8080

# Run container with OpenTelemetry initialization
CMD ["node", "-r", "@splunk/otel/instrument", "bin/server.js", "lib/database.js"]