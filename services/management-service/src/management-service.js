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
exports.ManagementService = void 0;
exports.getManagementService = getManagementService;
const shared_1 = require("@agent-memory/shared");
const database_1 = require("@agent-memory/database");
const vectorDb = __importStar(require("@agent-memory/vector-db"));
const openai_1 = __importDefault(require("openai"));
const cron = __importStar(require("node-cron"));
const logger = (0, shared_1.createLogger)('ManagementService');
class ManagementService {
    openai;
    forgettingScheduler;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Set filter rules for an agent
     */
    async setFilterRules(agentId, rules) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            await prisma.agent.update({
                where: { id: agentId },
                data: {
                    config: {
                        filterRules: rules,
                    },
                },
            });
            logger.info('Filter rules updated', { agentId, ruleCount: rules.length });
        }
        catch (error) {
            logger.error('Failed to set filter rules', error, { agentId });
            throw error;
        }
    }
    /**
     * Apply filter rules to memory input
     */
    async applyFilters(agentId, content, metadata) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                select: { config: true },
            });
            const config = agent?.config;
            const rules = config?.filterRules || [];
            for (const rule of rules) {
                let shouldFilter = false;
                switch (rule.type) {
                    case 'content':
                        shouldFilter = this.evaluateContentFilter(content, rule.condition);
                        break;
                    case 'metadata':
                        shouldFilter = this.evaluateMetadataFilter(metadata, rule.condition);
                        break;
                    case 'importance':
                        shouldFilter = this.evaluateImportanceFilter(metadata?.importance, rule.condition);
                        break;
                }
                if (shouldFilter) {
                    if (rule.action === 'reject') {
                        logger.debug('Memory rejected by filter', { agentId, rule: rule.type });
                        return false;
                    }
                }
            }
            return true;
        }
        catch (error) {
            logger.error('Failed to apply filters', error, { agentId });
            return true; // Default to accept on error
        }
    }
    evaluateContentFilter(content, condition) {
        // Simple keyword matching
        return content.toLowerCase().includes(condition.toLowerCase());
    }
    evaluateMetadataFilter(metadata, condition) {
        // Simple key existence check
        return metadata && metadata[condition] !== undefined;
    }
    evaluateImportanceFilter(importance, condition) {
        if (!importance)
            return false;
        const [operator, value] = condition.split(' ');
        const threshold = parseFloat(value);
        switch (operator) {
            case '>':
                return importance > threshold;
            case '<':
                return importance < threshold;
            case '>=':
                return importance >= threshold;
            case '<=':
                return importance <= threshold;
            case '==':
                return importance === threshold;
            default:
                return false;
        }
    }
    /**
     * Set forgetting policy for an agent
     */
    async setForgettingPolicy(agentId, policy) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            await prisma.agent.update({
                where: { id: agentId },
                data: {
                    config: {
                        forgettingPolicy: policy,
                    },
                },
            });
            logger.info('Forgetting policy updated', { agentId, enabled: policy.enabled });
            // Start scheduler if enabled
            if (policy.enabled && !this.forgettingScheduler) {
                this.startForgettingScheduler();
            }
        }
        catch (error) {
            logger.error('Failed to set forgetting policy', error, { agentId });
            throw error;
        }
    }
    /**
     * Start forgetting scheduler
     */
    startForgettingScheduler() {
        // Run every day at 2 AM
        this.forgettingScheduler = cron.schedule('0 2 * * *', async () => {
            logger.info('Running forgetting scheduler');
            try {
                await this.runForgettingProcess();
            }
            catch (error) {
                logger.error('Forgetting scheduler failed', error);
            }
        });
        logger.info('Forgetting scheduler started');
    }
    /**
     * Run forgetting process for all agents
     */
    async runForgettingProcess() {
        const prisma = (0, database_1.getPrismaClient)();
        const agents = await prisma.agent.findMany({
            select: { id: true, config: true },
        });
        for (const agent of agents) {
            const config = agent.config;
            const policy = config?.forgettingPolicy;
            if (policy?.enabled) {
                await this.forgetMemories(agent.id, policy);
            }
        }
    }
    /**
     * Forget memories based on policy
     */
    async forgetMemories(agentId, policy) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            let forgottenCount = 0;
            // Get memories to forget based on strategy
            let memoriesToForget = [];
            switch (policy.strategy) {
                case 'time-based':
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - policy.threshold);
                    memoriesToForget = await prisma.memoryIndex.findMany({
                        where: {
                            agentId,
                            createdAt: { lt: cutoffDate },
                        },
                    });
                    break;
                case 'access-based':
                    const accessCutoffDate = new Date();
                    accessCutoffDate.setDate(accessCutoffDate.getDate() - policy.threshold);
                    memoriesToForget = await prisma.memoryIndex.findMany({
                        where: {
                            agentId,
                            OR: [
                                { accessedAt: { lt: accessCutoffDate } },
                                { accessedAt: null, createdAt: { lt: accessCutoffDate } },
                            ],
                        },
                    });
                    break;
                case 'importance-based':
                    memoriesToForget = await prisma.memoryIndex.findMany({
                        where: {
                            agentId,
                            importance: { lt: policy.threshold },
                        },
                    });
                    break;
            }
            // Archive or delete
            for (const memory of memoriesToForget) {
                if (policy.archiveBeforeDelete) {
                    // Archive logic would go here
                    logger.debug('Archiving memory', { id: memory.id });
                }
                // Delete from vector database
                const collection = memory.memoryType === 'episodic'
                    ? vectorDb.COLLECTIONS.EPISODIC_MEMORIES
                    : vectorDb.COLLECTIONS.SEMANTIC_MEMORIES;
                const vectorId = memory.storageLocation.split(':').pop();
                if (vectorId) {
                    await vectorDb.deleteVector(collection, vectorId);
                }
                // Delete from PostgreSQL
                await prisma.memoryIndex.delete({ where: { id: memory.id } });
                forgottenCount++;
            }
            logger.info('Memories forgotten', { agentId, count: forgottenCount });
            return forgottenCount;
        }
        catch (error) {
            logger.error('Failed to forget memories', error, { agentId });
            return 0;
        }
    }
    /**
     * Consolidate memories (summarize and compress)
     */
    async consolidateMemories(agentId, options) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            // Get memories to consolidate
            const where = {
                agentId,
                memoryType: 'episodic',
            };
            if (options?.timeRange) {
                where.createdAt = {
                    gte: options.timeRange.start,
                    lte: options.timeRange.end,
                };
            }
            const memories = await prisma.memoryIndex.findMany({
                where,
                orderBy: { createdAt: 'asc' },
            });
            if (memories.length === 0) {
                return { originalCount: 0, consolidatedCount: 0, summary: '' };
            }
            // Fetch content from vector database
            const contents = [];
            for (const memory of memories) {
                try {
                    const vectorId = memory.storageLocation.split(':').pop();
                    if (vectorId) {
                        const client = vectorDb.getQdrantClient();
                        const points = await client.retrieve(vectorDb.COLLECTIONS.EPISODIC_MEMORIES, {
                            ids: [vectorId],
                            with_payload: true,
                        });
                        if (points.length > 0) {
                            contents.push(points[0].payload?.content);
                        }
                    }
                }
                catch (error) {
                    logger.warn('Failed to retrieve memory for consolidation', { id: memory.id });
                }
            }
            // Generate summary using LLM
            const summary = await this.generateSummary(contents, options?.summarizationLevel || 'medium');
            logger.info('Memories consolidated', {
                agentId,
                originalCount: memories.length,
                summaryLength: summary.length,
            });
            return {
                originalCount: memories.length,
                consolidatedCount: 1,
                summary,
            };
        }
        catch (error) {
            logger.error('Failed to consolidate memories', error, { agentId });
            throw error;
        }
    }
    /**
     * Generate summary using LLM
     */
    async generateSummary(contents, level) {
        try {
            const maxTokens = level === 'low' ? 100 : level === 'medium' ? 250 : 500;
            const prompt = `Summarize the following memories into a concise overview. Focus on key events, patterns, and important information.

Memories:
${contents.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide a ${level}-detail summary:`;
            const response = await this.openai.chat.completions.create({
                model: process.env.LLM_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI assistant that summarizes memories concisely.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: maxTokens,
            });
            return response.choices[0].message.content || 'Summary generation failed.';
        }
        catch (error) {
            logger.error('Failed to generate summary', error);
            return 'Summary generation failed.';
        }
    }
    /**
     * Get memory statistics
     */
    async getMemoryStats(agentId) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const memories = await prisma.memoryIndex.findMany({
                where: { agentId },
                select: {
                    memoryType: true,
                    importance: true,
                    createdAt: true,
                },
            });
            const byType = {};
            let totalImportance = 0;
            let importanceCount = 0;
            for (const memory of memories) {
                byType[memory.memoryType] = (byType[memory.memoryType] || 0) + 1;
                if (memory.importance) {
                    totalImportance += memory.importance.toNumber();
                    importanceCount++;
                }
            }
            const dates = memories.map((m) => m.createdAt).sort((a, b) => a.getTime() - b.getTime());
            return {
                totalMemories: memories.length,
                byType,
                storageSize: 0,
                oldestMemory: dates.length > 0 ? dates[0] : new Date(),
                newestMemory: dates.length > 0 ? dates[dates.length - 1] : new Date(),
                averageImportance: importanceCount > 0 ? totalImportance / importanceCount : 0,
            };
        }
        catch (error) {
            logger.error('Failed to get memory stats', error, { agentId });
            throw error;
        }
    }
    /**
     * Export memories
     */
    async exportMemories(agentId, format) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const memories = await prisma.memoryIndex.findMany({
                where: { agentId },
                orderBy: { createdAt: 'desc' },
            });
            if (format === 'json') {
                const json = JSON.stringify(memories, null, 2);
                return Buffer.from(json);
            }
            else {
                // CSV format
                const headers = 'id,type,importance,created_at\n';
                const rows = memories
                    .map((m) => `${m.id},${m.memoryType},${m.importance},${m.createdAt.toISOString()}`)
                    .join('\n');
                return Buffer.from(headers + rows);
            }
        }
        catch (error) {
            logger.error('Failed to export memories', error, { agentId });
            throw error;
        }
    }
    /**
     * Purge all memories for an agent
     */
    async purgeMemories(agentId) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const memories = await prisma.memoryIndex.findMany({
                where: { agentId },
            });
            let deletedCount = 0;
            for (const memory of memories) {
                try {
                    const collection = memory.memoryType === 'episodic'
                        ? vectorDb.COLLECTIONS.EPISODIC_MEMORIES
                        : memory.memoryType === 'semantic'
                            ? vectorDb.COLLECTIONS.SEMANTIC_MEMORIES
                            : vectorDb.COLLECTIONS.REFLECTIONS;
                    const vectorId = memory.storageLocation.split(':').pop();
                    if (vectorId) {
                        await vectorDb.deleteVector(collection, vectorId);
                    }
                    await prisma.memoryIndex.delete({ where: { id: memory.id } });
                    deletedCount++;
                }
                catch (error) {
                    logger.warn('Failed to delete memory during purge', { id: memory.id });
                }
            }
            logger.info('Memories purged', { agentId, count: deletedCount });
            return deletedCount;
        }
        catch (error) {
            logger.error('Failed to purge memories', error, { agentId });
            throw error;
        }
    }
}
exports.ManagementService = ManagementService;
// Singleton instance
let managementService;
function getManagementService() {
    if (!managementService) {
        managementService = new ManagementService();
    }
    return managementService;
}
//# sourceMappingURL=management-service.js.map