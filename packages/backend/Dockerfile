FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY packages/backend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY packages/backend ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "dist/index.js"] 