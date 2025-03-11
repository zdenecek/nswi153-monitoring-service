# Monitoring Service

A modern monitoring service implementation that allows users to monitor various endpoints and services through different types of monitors (ping, website). Built with TypeScript, Express, and React.

## Features

- Project management with labels, descriptions, and tags
- Multiple monitor types (Ping, Website)
- Real-time monitoring with configurable intervals
- Various visualization modes (List, Calendar, Graph)
- RESTful API and GraphQL support
- Badge generation for status sharing
- Docker-based deployment

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL for data persistence
- GraphQL with Apollo Server
- OpenAPI/Swagger documentation

### Frontend
- React with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Query for data fetching
- React Router for navigation
- Recharts for graphs

## Installation

1. Clone the repository:
```bash
git clone {repository-url} .
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory (see .env.example for required variables)

4. Run with Docker:
```bash
docker compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql
- API Documentation: http://localhost:4000/api-docs

## Development

For local development:

1. Start the backend:
```bash
cd packages/backend
npm run dev
```

2. Start the frontend:
```bash
cd packages/frontend
npm run dev
```

## Project Structure

```
.
├── packages/
│   ├── backend/         # Express backend
│   ├── frontend/        # React frontend
│   └── shared/          # Shared types and utilities
├── docker/              # Docker configuration
├── docker-compose.yml   # Docker compose configuration
└── package.json         # Root package.json for workspaces
```

