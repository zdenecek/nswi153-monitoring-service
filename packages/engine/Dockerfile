FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/engine/ ./packages/engine/

RUN npm install
RUN npm run build --workspace=shared
RUN npm run build --workspace=engine

CMD ["node", "packages/engine/dist/index.js"] 