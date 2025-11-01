import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { asyncHandler } from '../middleware/error-handler';
import { getPrismaClient } from '@agent-memory/database';
import { validate, agentConfigSchema } from '@agent-memory/shared';

const router: Router = Router();

/**
 * Create agent
 * POST /v1/agents
 */
router.post(
  '/',
  authenticateJWT,
  requirePermission('write'),
  asyncHandler(async (req: any, res: any) => {
    const validatedData = validate(agentConfigSchema, req.body);
    const prisma = getPrismaClient();

    const agent = await prisma.agent.create({
      data: {
        userId: req.user.userId,
        name: validatedData.name,
        config: {
          stmWindowSize: validatedData.stmWindowSize,
          embeddingModel: validatedData.embeddingModel,
          reflectionThreshold: validatedData.reflectionThreshold,
          filterRules: validatedData.filterRules,
          forgettingPolicy: validatedData.forgettingPolicy,
        },
      },
    });

    res.status(201).json({
      id: agent.id,
      name: agent.name,
      createdAt: agent.createdAt,
    });
  })
);

/**
 * Get agent
 * GET /v1/agents/:agentId
 */
router.get(
  '/:agentId',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const prisma = getPrismaClient();

    const agent = await prisma.agent.findUnique({
      where: { id: req.params.agentId },
    });

    if (!agent) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }

    res.json({
      id: agent.id,
      name: agent.name,
      config: agent.config,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    });
  })
);

/**
 * Update agent
 * PUT /v1/agents/:agentId
 */
router.put(
  '/:agentId',
  authenticateJWT,
  requirePermission('write'),
  asyncHandler(async (req: any, res: any) => {
    const prisma = getPrismaClient();

    const agent = await prisma.agent.update({
      where: { id: req.params.agentId },
      data: {
        name: req.body.name,
        config: req.body.config,
      },
    });

    res.json({
      id: agent.id,
      name: agent.name,
      updatedAt: agent.updatedAt,
    });
  })
);

/**
 * Delete agent
 * DELETE /v1/agents/:agentId
 */
router.delete(
  '/:agentId',
  authenticateJWT,
  requirePermission('write'),
  asyncHandler(async (req: any, res: any) => {
    const prisma = getPrismaClient();

    await prisma.agent.delete({
      where: { id: req.params.agentId },
    });

    res.status(204).send();
  })
);

export default router;
