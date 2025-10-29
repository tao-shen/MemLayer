import { Router } from 'express';
import agentRoutes from './agents';
import memoryRoutes from './memories';
import sessionRoutes from './sessions';
import ragRoutes from './rag';
import reflectionRoutes from './reflections';
import managementRoutes from './management';

const router = Router();

// Mount routes
router.use('/agents', agentRoutes);
router.use('/agents/:agentId/memories', memoryRoutes);
router.use('/agents/:agentId/sessions', sessionRoutes);
router.use('/agents/:agentId/rag', ragRoutes);
router.use('/agents/:agentId/reflections', reflectionRoutes);
router.use('/agents/:agentId/management', managementRoutes);

export default router;
