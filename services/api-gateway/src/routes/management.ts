import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getManagementService } from '../../../management-service/src/management-service';

const router = Router({ mergeParams: true });

// PUT /v1/agents/:agentId/management/filters
router.put('/filters', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const managementService = getManagementService();
  await managementService.setFilterRules(req.params.agentId, req.body.rules);
  res.json({ success: true });
}));

// PUT /v1/agents/:agentId/management/forgetting
router.put('/forgetting', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const managementService = getManagementService();
  await managementService.setForgettingPolicy(req.params.agentId, req.body.policy);
  res.json({ success: true });
}));

// POST /v1/agents/:agentId/management/consolidate
router.post('/consolidate', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const managementService = getManagementService();
  const result = await managementService.consolidateMemories(req.params.agentId, req.body.options);
  res.json(result);
}));

// GET /v1/agents/:agentId/management/stats
router.get('/stats', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const managementService = getManagementService();
  const stats = await managementService.getMemoryStats(req.params.agentId);
  res.json(stats);
}));

// GET /v1/agents/:agentId/management/export
router.get('/export', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const managementService = getManagementService();
  const format = (req.query.format as 'json' | 'csv') || 'json';
  const data = await managementService.exportMemories(req.params.agentId, format);
  
  res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=memories.${format}`);
  res.send(data);
}));

// DELETE /v1/agents/:agentId/management/purge
router.delete('/purge', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const managementService = getManagementService();
  const count = await managementService.purgeMemories(req.params.agentId);
  res.json({ deletedCount: count });
}));

export default router;
