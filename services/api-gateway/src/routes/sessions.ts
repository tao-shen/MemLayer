import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getMemoryService } from '../../../memory-service/src/memory-service';

const router = Router({ mergeParams: true });

// POST /v1/agents/:agentId/sessions
router.post('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const memoryService = getMemoryService();
  const sessionId = await memoryService.createSession(req.params.agentId, req.body.metadata);
  res.status(201).json({ id: sessionId });
}));

// DELETE /v1/agents/:agentId/sessions/:sessionId
router.delete('/:sessionId', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const memoryService = getMemoryService();
  await memoryService.endSession(req.params.sessionId);
  res.status(204).send();
}));

export default router;
