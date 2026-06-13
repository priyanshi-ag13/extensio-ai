# Dockerfile for Extensio.ai
# Day 8 - Commit 20: Containerizing the application

# Use official Node.js image (lightweight Alpine version)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all application code
COPY . .

# Create necessary directories
RUN mkdir -p downloads temp

# Expose port 3000
EXPOSE 3000

# Health check to monitor if app is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
CMD ["node", "server.js"]