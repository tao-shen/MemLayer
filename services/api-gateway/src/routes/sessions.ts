import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getTacitService } from '../../../tacit-service/src/tacit-service';

const router: Router = Router({ mergeParams: true });

// POST /v1/agents/:agentId/sessions
router.post('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const tacitService = getTacitService();
  const sessionId = await tacitService.createSession(req.params.agentId, req.body.metadata);
  res.status(201).json({ id: sessionId });
}));

// DELETE /v1/agents/:agentId/sessions/:sessionId
router.delete('/:sessionId', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const tacitService = getTacitService();
  await tacitService.endSession(req.params.sessionId);
  res.status(204).send();
}));

export default router;
