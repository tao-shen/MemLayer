import { Router } from 'express';
import axios from 'axios';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router: Router = Router();

const SKILL_CREATOR_SERVICE = process.env.SKILL_CREATOR_SERVICE_URL || 'http://localhost:3001';

/**
 * Upload files for skill creation
 * POST /v1/skills/create/upload
 */
router.post(
  '/create/upload',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    // Forward multipart form data to skill creator service
    const response = await axios.post(
      `${SKILL_CREATOR_SERVICE}/api/upload`,
      req.body,
      {
        headers: {
          'Content-Type': req.headers['content-type'],
        },
      }
    );
    
    res.json(response.data);
  })
);

/**
 * Analyze uploaded files
 * POST /v1/skills/create/analyze
 */
router.post(
  '/create/analyze',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const response = await axios.post(
      `${SKILL_CREATOR_SERVICE}/api/analyze`,
      req.body
    );
    
    res.json(response.data);
  })
);

/**
 * Get analysis status
 * GET /v1/skills/create/status/:jobId
 */
router.get(
  '/create/status/:jobId',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const { jobId } = req.params;
    
    const response = await axios.get(
      `${SKILL_CREATOR_SERVICE}/api/status/${jobId}`
    );
    
    res.json(response.data);
  })
);

/**
 * Generate skill from analysis
 * POST /v1/skills/create/generate
 */
router.post(
  '/create/generate',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const response = await axios.post(
      `${SKILL_CREATOR_SERVICE}/api/generate`,
      {
        ...req.body,
        userId: req.user.userId,
      }
    );
    
    res.json(response.data);
  })
);

/**
 * Save skill
 * POST /v1/skills
 */
router.post(
  '/',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const response = await axios.post(
      `${SKILL_CREATOR_SERVICE}/api/skills`,
      req.body
    );
    
    res.json(response.data);
  })
);

/**
 * Get user skills
 * GET /v1/skills
 */
router.get(
  '/',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const response = await axios.get(
      `${SKILL_CREATOR_SERVICE}/api/skills`,
      {
        params: {
          userId: req.user.userId,
          ...req.query,
        },
      }
    );
    
    res.json(response.data);
  })
);

/**
 * Get skill by ID
 * GET /v1/skills/:skillId
 */
router.get(
  '/:skillId',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const { skillId } = req.params;
    
    const response = await axios.get(
      `${SKILL_CREATOR_SERVICE}/api/skills/${skillId}`
    );
    
    res.json(response.data);
  })
);

/**
 * Update skill
 * PUT /v1/skills/:skillId
 */
router.put(
  '/:skillId',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const { skillId } = req.params;
    
    const response = await axios.put(
      `${SKILL_CREATOR_SERVICE}/api/skills/${skillId}`,
      req.body
    );
    
    res.json(response.data);
  })
);

/**
 * Delete skill
 * DELETE /v1/skills/:skillId
 */
router.delete(
  '/:skillId',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const { skillId } = req.params;
    
    await axios.delete(
      `${SKILL_CREATOR_SERVICE}/api/skills/${skillId}`
    );
    
    res.status(204).send();
  })
);

/**
 * Execute skill
 * POST /v1/skills/:skillId/execute
 */
router.post(
  '/:skillId/execute',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const { skillId } = req.params;
    
    const response = await axios.post(
      `${SKILL_CREATOR_SERVICE}/api/skills/${skillId}/execute`,
      {
        ...req.body,
        userId: req.user.userId,
      }
    );
    
    res.json(response.data);
  })
);

/**
 * Get execution history
 * GET /v1/skills/:skillId/history
 */
router.get(
  '/:skillId/history',
  authenticateJWT,
  asyncHandler(async (req: any, res: any) => {
    const { skillId } = req.params;
    
    const response = await axios.get(
      `${SKILL_CREATOR_SERVICE}/api/skills/${skillId}/history`
    );
    
    res.json(response.data);
  })
);

export default router;
