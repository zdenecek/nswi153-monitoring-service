FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY packages/frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY packages/frontend ./

# Expose port
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 