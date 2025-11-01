import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@agent-memory/shared';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { rateLimiters } from './middleware/rate-limit';
import apiRoutes from './routes';

const logger = createLogger('APIGateway');

const app: express.Application = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Rate limiting
app.use(rateLimiters.standard);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
  });
});

// API routes
app.use('/v1', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`API Gateway listening on port ${port}`);
});

export default app;
