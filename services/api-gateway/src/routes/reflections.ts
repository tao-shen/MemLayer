import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getReflectionEngine } from '../../../reflection-service/src/reflection-engine';

const router: Router = Router({ mergeParams: true });

// POST /v1/agents/:agentId/reflections
router.post('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const reflectionEngine = getReflectionEngine();
  const reflection = await reflectionEngine.triggerReflection(req.params.agentId, req.body.context);
  res.status(201).json(reflection);
}));

// GET /v1/agents/:agentId/reflections
router.get('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const reflectionEngine = getReflectionEngine();
  const reflections = await reflectionEngine.getReflections(req.params.agentId, req.query.limit);
  res.json({ reflections });
}));

export default router;
