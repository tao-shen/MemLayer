import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { getStandardRAG } from '../../../retrieval-service/src/rag/standard-rag';
import { getAgenticRAG } from '../../../retrieval-service/src/rag/agentic-rag';

const router: Router = Router({ mergeParams: true });

// POST /v1/agents/:agentId/rag/retrieve
router.post('/retrieve', authenticateJWT, asyncHandler(async (req: any, res: any) => {
  const mode = req.body.mode || 'standard';
  
  if (mode === 'agentic') {
    const agenticRAG = getAgenticRAG();
    const result = await agenticRAG.execute({
      ...req.body,
      agentId: req.params.agentId,
    });
    res.json(result);
  } else {
    const standardRAG = getStandardRAG();
    const result = await standardRAG.execute({
      ...req.body,
      agentId: req.params.agentId,
    });
    res.json(result);
  }
}));

export default router;
