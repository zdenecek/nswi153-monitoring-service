import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { DataSource } from 'typeorm';

import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { projectRouter } from './routes/project';
import { monitorRouter } from './routes/monitor';
import { statusRouter } from './routes/status';
import { badgeRouter } from './routes/badge';
import { entities } from './entities';

const PORT = process.env.PORT || 4000;

// Database connection
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'monitoring_service',
  synchronize: true,
  logging: true,
  entities,
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Monitoring Service API',
      version: '1.0.0',
      description: 'API documentation for the Monitoring Service',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Apollo Server setup
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ req }),
    })
  );

  // REST API routes
  app.use('/api/projects', projectRouter);
  app.use('/api/monitors', monitorRouter);
  app.use('/api/status', statusRouter);
  app.use('/badge', badgeRouter);

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Start server
    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`📚 GraphQL Playground available at http://localhost:${PORT}/graphql`);
    console.log(`📖 API documentation available at http://localhost:${PORT}/api-docs`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 