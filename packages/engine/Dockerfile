FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/engine/ ./packages/engine/

RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build engine package
WORKDIR /app/packages/engine
RUN npm run build

# Set working directory back to engine for the CMD
WORKDIR /app/packages/engine

CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"] 