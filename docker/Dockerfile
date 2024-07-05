FROM node:16

LABEL maintainer="K Hargreaves"

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Clone game source code
RUN git clone https://github.com/wedge22/pacman.git .

# Install app dependencies including @splunk/otel package
RUN npm install @splunk/otel

# Set appropriate permissions
RUN chmod -R go+r /usr/src/app/node_modules/@splunk/otel

# Install remaining app dependencies
RUN npm install

# Expose port 8080
EXPOSE 8080

# Run container
CMD ["npm", "start"]