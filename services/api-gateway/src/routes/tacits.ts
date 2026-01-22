import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getTacitService } from '../../../tacit-service/src/tacit-service';

const router: Router = Router({ mergeParams: true });

// POST /v1/agents/:agentId/tacits
router.post('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const tacitService = getTacitService();
  const tacitId = await tacitService.storeTacit({
    ...req.body,
    agentId: req.params.agentId,
  });
  res.status(201).json({ id: tacitId });
}));

// GET /v1/agents/:agentId/tacits
router.get('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const tacitService = getTacitService();
  const tacits = await tacitService.retrieveTacits({
    agentId: req.params.agentId,
    ...req.query,
  });
  res.json({ tacits });
}));

// DELETE /v1/agents/:agentId/tacits/:tacitId
router.delete('/:tacitId', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const tacitService = getTacitService();
  await tacitService.deleteTacit(req.params.tacitId);
  res.status(204).send();
}));

export default router;
