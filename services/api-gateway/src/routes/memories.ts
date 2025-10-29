import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getMemoryService } from '../../../memory-service/src/memory-service';

const router = Router({ mergeParams: true });

// POST /v1/agents/:agentId/memories
router.post('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const memoryService = getMemoryService();
  const memoryId = await memoryService.storeMemory({
    ...req.body,
    agentId: req.params.agentId,
  });
  res.status(201).json({ id: memoryId });
}));

// GET /v1/agents/:agentId/memories
router.get('/', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const memoryService = getMemoryService();
  const memories = await memoryService.retrieveMemories({
    agentId: req.params.agentId,
    ...req.query,
  });
  res.json({ memories });
}));

// DELETE /v1/agents/:agentId/memories/:memoryId
router.delete('/:memoryId', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const memoryService = getMemoryService();
  await memoryService.deleteMemory(req.params.memoryId);
  res.status(204).send();
}));

export default router;
