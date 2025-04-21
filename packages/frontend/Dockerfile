FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build shared package
RUN cd packages/shared && npm run build

# Expose port
EXPOSE 5173

# Set environment variables
ENV NODE_ENV=development

# Run development server with hot reloading
CMD ["npm", "run", "dev", "--workspace=frontend", "--", "--host", "0.0.0.0"] 