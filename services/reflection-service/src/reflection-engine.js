"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectionEngine = void 0;
exports.getReflectionEngine = getReflectionEngine;
const shared_1 = require("@agent-memory/shared");
const database_1 = require("@agent-memory/database");
const vectorDb = __importStar(require("@agent-memory/vector-db"));
const cache = __importStar(require("@agent-memory/cache"));
const openai_1 = __importDefault(require("openai"));
const shared_2 = require("@agent-memory/shared");
const uuid_1 = require("uuid");
const logger = (0, shared_1.createLogger)('ReflectionEngine');
class ReflectionEngine {
    openai;
    defaultThreshold;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
        });
        this.defaultThreshold = parseInt(process.env.REFLECTION_IMPORTANCE_THRESHOLD || '50');
    }
    /**
     * Check if reflection should be triggered
     */
    async shouldReflect(agentId) {
        try {
            // Get accumulated importance since last reflection
            const accumulated = await this.getAccumulatedImportance(agentId);
            const threshold = await this.getThreshold(agentId);
            const should = accumulated >= threshold;
            logger.debug('Reflection check', {
                agentId,
                accumulated,
                threshold,
                shouldReflect: should,
            });
            return should;
        }
        catch (error) {
            logger.error('Failed to check reflection trigger', error, { agentId });
            return false;
        }
    }
    /**
     * Get accumulated importance since last reflection
     */
    async getAccumulatedImportance(agentId) {
        const key = `reflection:accumulated:${agentId}`;
        const accumulated = await cache.get(key);
        return accumulated || 0;
    }
    /**
     * Increment accumulated importance
     */
    async incrementAccumulated(agentId, importance) {
        const key = `reflection:accumulated:${agentId}`;
        await cache.incrby(key, Math.round(importance));
    }
    /**
     * Reset accumulated importance
     */
    async resetAccumulated(agentId) {
        const key = `reflection:accumulated:${agentId}`;
        await cache.set(key, 0);
    }
    /**
     * Get reflection threshold for agent
     */
    async getThreshold(agentId) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                select: { config: true },
            });
            const config = agent?.config;
            return config?.reflectionThreshold || this.defaultThreshold;
        }
        catch (error) {
            return this.defaultThreshold;
        }
    }
    /**
     * Trigger reflection process
     */
    async triggerReflection(agentId, context) {
        try {
            logger.info('Triggering reflection', { agentId });
            // Step 1: Retrieve recent memories
            const memories = await this.retrieveRecentMemories(agentId, context);
            if (memories.length === 0) {
                throw new Error('No memories found for reflection');
            }
            // Step 2: Generate insights using LLM
            const insights = await this.generateInsights(memories);
            // Step 3: Store reflection
            const reflection = await this.storeReflection(agentId, insights, memories);
            // Step 4: Reset accumulated importance
            await this.resetAccumulated(agentId);
            logger.info('Reflection completed', {
                agentId,
                insightCount: insights.length,
                sourceMemoryCount: memories.length,
            });
            return reflection;
        }
        catch (error) {
            logger.error('Reflection failed', error, { agentId });
            throw error;
        }
    }
    /**
     * Retrieve recent memories for reflection
     */
    async retrieveRecentMemories(agentId, context) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            // Build query conditions
            const where = {
                agentId,
                memoryType: 'episodic',
            };
            if (context?.timeRange) {
                where.createdAt = {
                    gte: context.timeRange.start,
                    lte: context.timeRange.end,
                };
            }
            if (context?.importanceThreshold) {
                where.importance = {
                    gte: context.importanceThreshold,
                };
            }
            // Query memories
            const memoryIndices = await prisma.memoryIndex.findMany({
                where,
                orderBy: {
                    importance: 'desc',
                },
                take: context?.maxMemories || 20,
                select: {
                    id: true,
                    importance: true,
                    storageLocation: true,
                },
            });
            // Fetch content from vector database
            const memories = [];
            for (const index of memoryIndices) {
                try {
                    const vectorId = index.storageLocation.split(':').pop();
                    if (vectorId) {
                        const client = vectorDb.getQdrantClient();
                        const points = await client.retrieve(vectorDb.COLLECTIONS.EPISODIC_MEMORIES, {
                            ids: [vectorId],
                            with_payload: true,
                        });
                        if (points.length > 0) {
                            memories.push({
                                id: index.id,
                                content: points[0].payload?.content,
                                importance: index.importance?.toNumber() || 5,
                            });
                        }
                    }
                }
                catch (error) {
                    logger.warn('Failed to retrieve memory content', { id: index.id });
                }
            }
            return memories;
        }
        catch (error) {
            logger.error('Failed to retrieve memories for reflection', error, { agentId });
            throw error;
        }
    }
    /**
     * Generate insights from memories using LLM
     */
    async generateInsights(memories) {
        try {
            // Build prompt
            const memoryTexts = memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
            const prompt = `Based on the following observations and experiences, generate 3-5 high-level insights or patterns. Focus on identifying:
- Recurring themes or patterns
- Important relationships or connections
- Key learnings or conclusions
- Behavioral patterns or preferences

Observations:
${memoryTexts}

Please provide insights as a numbered list, with each insight being a concise statement (1-2 sentences).`;
            // Call LLM
            const response = await this.openai.chat.completions.create({
                model: process.env.LLM_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI assistant that helps analyze memories and generate meaningful insights.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });
            const content = response.choices[0].message.content || '';
            // Parse insights from response
            const insights = content
                .split('\n')
                .filter((line) => /^\d+\./.test(line.trim()))
                .map((line) => line.replace(/^\d+\.\s*/, '').trim())
                .filter((insight) => insight.length > 0);
            logger.debug('Generated insights', { count: insights.length });
            return insights;
        }
        catch (error) {
            logger.error('Failed to generate insights', error);
            // Return fallback insights
            return ['Accumulated significant experiences requiring further analysis.'];
        }
    }
    /**
     * Store reflection in database
     */
    async storeReflection(agentId, insights, sourceMemories) {
        try {
            const id = (0, uuid_1.v4)();
            const timestamp = new Date();
            // Generate embedding for insights
            const embeddingClient = (0, shared_2.getEmbeddingClient)();
            const insightsText = insights.join(' ');
            const embedding = await embeddingClient.generateEmbedding(insightsText);
            // Store in vector database
            await vectorDb.upsertVector({
                collection: vectorDb.COLLECTIONS.REFLECTIONS,
                id,
                vector: embedding,
                payload: {
                    agent_id: agentId,
                    insights,
                    source_memory_ids: sourceMemories.map((m) => m.id),
                    importance: 8, // Reflections are high importance
                    timestamp: timestamp.toISOString(),
                },
            });
            // Store metadata in PostgreSQL
            const prisma = (0, database_1.getPrismaClient)();
            await prisma.memoryIndex.create({
                data: {
                    id,
                    agentId,
                    memoryType: 'reflection',
                    storageLocation: `qdrant:${vectorDb.COLLECTIONS.REFLECTIONS}:${id}`,
                    importance: 8,
                    metadata: {
                        insightCount: insights.length,
                        sourceMemoryCount: sourceMemories.length,
                    },
                },
            });
            logger.info('Stored reflection', { id, agentId, insightCount: insights.length });
            return {
                id,
                agentId,
                insights,
                sourceMemories: sourceMemories.map((m) => m.id),
                importance: 8,
                timestamp,
            };
        }
        catch (error) {
            logger.error('Failed to store reflection', error, { agentId });
            throw error;
        }
    }
    /**
     * Get reflection history for an agent
     */
    async getReflections(agentId, limit = 10) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const reflectionIndices = await prisma.memoryIndex.findMany({
                where: {
                    agentId,
                    memoryType: 'reflection',
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
            });
            const reflections = [];
            for (const index of reflectionIndices) {
                try {
                    const vectorId = index.storageLocation.split(':').pop();
                    if (vectorId) {
                        const client = vectorDb.getQdrantClient();
                        const points = await client.retrieve(vectorDb.COLLECTIONS.REFLECTIONS, {
                            ids: [vectorId],
                            with_payload: true,
                        });
                        if (points.length > 0) {
                            const payload = points[0].payload;
                            reflections.push({
                                id: index.id,
                                agentId,
                                insights: payload.insights,
                                sourceMemories: payload.source_memory_ids,
                                importance: payload.importance,
                                timestamp: new Date(payload.timestamp),
                            });
                        }
                    }
                }
                catch (error) {
                    logger.warn('Failed to retrieve reflection', { id: index.id });
                }
            }
            return reflections;
        }
        catch (error) {
            logger.error('Failed to get reflections', error, { agentId });
            throw error;
        }
    }
}
exports.ReflectionEngine = ReflectionEngine;
// Singleton instance
let reflectionEngine;
function getReflectionEngine() {
    if (!reflectionEngine) {
        reflectionEngine = new ReflectionEngine();
    }
    return reflectionEngine;
}
//# sourceMappingURL=reflection-engine.js.map