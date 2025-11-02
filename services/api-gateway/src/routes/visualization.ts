import { Router, Request, Response, NextFunction } from 'express';
import { VisualizationService } from '../../../visualization-service/src';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';

const router = Router();
const visualizationService = new VisualizationService();

/**
 * GET /v1/agents/:agentId/visualization/data
 * Get visualization data for an agent
 */
router.get(
  '/v1/agents/:agentId/visualization/data',
  authenticate,
  authorize,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;
      const {
        types,
        startDate,
        endDate,
        minImportance,
        maxImportance,
        searchQuery,
        sessionId,
        includeRelationships,
        includeSimilarities,
        similarityThreshold,
      } = req.query;

      // Build filters
      const filters: any = {};
      
      if (types) {
        filters.types = (types as string).split(',');
      }
      
      if (startDate && endDate) {
        filters.timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      if (minImportance !== undefined && maxImportance !== undefined) {
        filters.importanceRange = {
          min: parseInt(minImportance as string),
          max: parseInt(maxImportance as string),
        };
      }
      
      if (searchQuery) {
        filters.searchQuery = searchQuery as string;
      }
      
      if (sessionId) {
        filters.sessionId = sessionId as string;
      }

      const data = await visualizationService.getVisualizationData({
        agentId,
        filters,
        includeRelationships: includeRelationships === 'true',
        includeSimilarities: includeSimilarities === 'true',
        similarityThreshold: similarityThreshold ? parseFloat(similarityThreshold as string) : undefined,
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/agents/:agentId/visualization/timeline
 * Get timeline data for an agent
 */
router.get(
  '/v1/agents/:agentId/visualization/timeline',
  authenticate,
  authorize,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;
      const {
        types,
        startDate,
        endDate,
        minImportance,
        maxImportance,
        searchQuery,
        includeMilestones,
      } = req.query;

      // Build filters
      const filters: any = {};
      
      if (types) {
        filters.types = (types as string).split(',');
      }
      
      if (startDate && endDate) {
        filters.timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      if (minImportance !== undefined && maxImportance !== undefined) {
        filters.importanceRange = {
          min: parseInt(minImportance as string),
          max: parseInt(maxImportance as string),
        };
      }
      
      if (searchQuery) {
        filters.searchQuery = searchQuery as string;
      }

      const data = await visualizationService.getTimelineData({
        agentId,
        filters,
        includeMilestones: includeMilestones === 'true',
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/agents/:agentId/visualization/graph
 * Get graph data for an agent
 */
router.get(
  '/v1/agents/:agentId/visualization/graph',
  authenticate,
  authorize,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;
      const {
        types,
        startDate,
        endDate,
        minImportance,
        maxImportance,
        searchQuery,
        layout,
        showSimilarityEdges,
        similarityThreshold,
      } = req.query;

      // Build filters
      const filters: any = {};
      
      if (types) {
        filters.types = (types as string).split(',');
      }
      
      if (startDate && endDate) {
        filters.timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      if (minImportance !== undefined && maxImportance !== undefined) {
        filters.importanceRange = {
          min: parseInt(minImportance as string),
          max: parseInt(maxImportance as string),
        };
      }
      
      if (searchQuery) {
        filters.searchQuery = searchQuery as string;
      }

      const data = await visualizationService.getGraphData({
        agentId,
        filters,
        layout: (layout as any) || 'force-directed',
        showSimilarityEdges: showSimilarityEdges === 'true',
        similarityThreshold: similarityThreshold ? parseFloat(similarityThreshold as string) : undefined,
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/agents/:agentId/visualization/statistics
 * Get statistics for an agent
 */
router.get(
  '/v1/agents/:agentId/visualization/statistics',
  authenticate,
  authorize,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;
      const { timeGranularity, includeAccessFrequency } = req.query;

      const data = await visualizationService.getStatistics(agentId, {
        timeGranularity: (timeGranularity as any) || 'day',
        includeAccessFrequency: includeAccessFrequency === 'true',
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /v1/agents/:agentId/visualization/export
 * Export visualization data
 */
router.post(
  '/v1/agents/:agentId/visualization/export',
  authenticate,
  authorize,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;
      const { format, includeMetadata, filters } = req.body;

      // Get visualization data
      const data = await visualizationService.getVisualizationData({
        agentId,
        filters: filters || {},
        includeRelationships: true,
        includeSimilarities: false,
      });

      // Export based on format
      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="memories-${agentId}.json"`);
          res.json(includeMetadata ? data : data.memories);
          break;

        case 'csv':
          const csv = convertToCSV(data.memories);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="memories-${agentId}.csv"`);
          res.send(csv);
          break;

        default:
          res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Convert memories to CSV format
 */
function convertToCSV(memories: any[]): string {
  if (memories.length === 0) return '';

  const headers = ['id', 'agentId', 'type', 'content', 'timestamp', 'importance'];
  const rows = memories.map(m => [
    m.id,
    m.agentId,
    m.type,
    `"${m.content.replace(/"/g, '""')}"`,
    m.timestamp,
    m.importance || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

export default router;
