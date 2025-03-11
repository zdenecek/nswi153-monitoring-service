FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared package
RUN cd packages/shared && npm run build

# Build backend
RUN cd packages/backend && npm run build

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "packages/backend/dist/index.js"] 