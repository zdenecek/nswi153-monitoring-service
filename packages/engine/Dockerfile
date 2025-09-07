FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY packages/engine/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY packages/engine ./

# Build the application
RUN npm run build

# Start the application
CMD ["node", "dist/index.js"] 