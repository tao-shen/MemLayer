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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticMemoryEngine = void 0;
exports.getSemanticMemoryEngine = getSemanticMemoryEngine;
const shared_1 = require("@agent-memory/shared");
const kg = __importStar(require("@agent-memory/knowledge-graph"));
const vectorDb = __importStar(require("@agent-memory/vector-db"));
const database_1 = require("@agent-memory/database");
const shared_2 = require("@agent-memory/shared");
const uuid_1 = require("uuid");
const logger = (0, shared_1.createLogger)('SemanticMemoryEngine');
class SemanticMemoryEngine {
    /**
     * Create entity in knowledge graph
     */
    async createEntity(entity) {
        try {
            const id = await kg.createEntity(entity);
            logger.info('Created entity', { id, type: entity.type });
            return id;
        }
        catch (error) {
            logger.error('Failed to create entity', error, { type: entity.type });
            throw error;
        }
    }
    /**
     * Get entity by ID
     */
    async getEntity(id) {
        try {
            return await kg.getEntity(id);
        }
        catch (error) {
            logger.error('Failed to get entity', error, { id });
            throw error;
        }
    }
    /**
     * Update entity
     */
    async updateEntity(id, properties) {
        try {
            await kg.updateEntity(id, properties);
            logger.info('Updated entity', { id });
        }
        catch (error) {
            logger.error('Failed to update entity', error, { id });
            throw error;
        }
    }
    /**
     * Delete entity
     */
    async deleteEntity(id) {
        try {
            await kg.deleteEntity(id);
            logger.info('Deleted entity', { id });
        }
        catch (error) {
            logger.error('Failed to delete entity', error, { id });
            throw error;
        }
    }
    /**
     * Create relation between entities
     */
    async createRelation(relation) {
        try {
            await kg.createRelation(relation);
            logger.info('Created relation', {
                from: relation.from,
                to: relation.to,
                type: relation.type,
            });
        }
        catch (error) {
            logger.error('Failed to create relation', error, {
                from: relation.from,
                to: relation.to,
            });
            throw error;
        }
    }
    /**
     * Delete relation
     */
    async deleteRelation(from, to, type) {
        try {
            await kg.deleteRelation(from, to, type);
            logger.info('Deleted relation', { from, to, type });
        }
        catch (error) {
            logger.error('Failed to delete relation', error, { from, to, type });
            throw error;
        }
    }
    /**
     * Store fact (triple) in knowledge graph
     */
    async storeFact(fact) {
        try {
            await kg.storeFact(fact);
            logger.info('Stored fact', {
                subject: fact.subject,
                predicate: fact.predicate,
                object: fact.object,
            });
        }
        catch (error) {
            logger.error('Failed to store fact', error, {
                subject: fact.subject,
                predicate: fact.predicate,
            });
            throw error;
        }
    }
    /**
     * Store semantic memory with vector embedding
     */
    async storeSemanticMemory(agentId, content, source, category) {
        try {
            const id = (0, uuid_1.v4)();
            // Generate embedding
            const embeddingClient = (0, shared_2.getEmbeddingClient)();
            const embedding = await embeddingClient.generateEmbedding(content);
            // Store in vector database
            await vectorDb.upsertVector({
                collection: vectorDb.COLLECTIONS.SEMANTIC_MEMORIES,
                id,
                vector: embedding,
                payload: {
                    agent_id: agentId,
                    content,
                    source,
                    category: category || 'general',
                    verified: false,
                    created_at: new Date().toISOString(),
                },
            });
            // Store metadata in PostgreSQL
            const prisma = (0, database_1.getPrismaClient)();
            await prisma.memoryIndex.create({
                data: {
                    id,
                    agentId,
                    memoryType: 'semantic',
                    storageLocation: `qdrant:${vectorDb.COLLECTIONS.SEMANTIC_MEMORIES}:${id}`,
                    metadata: {
                        source,
                        category: category || 'general',
                        verified: false,
                    },
                },
            });
            logger.info('Stored semantic memory', { id, agentId, source, category });
            return id;
        }
        catch (error) {
            logger.error('Failed to store semantic memory', error, { agentId });
            throw error;
        }
    }
    /**
     * Query knowledge graph
     */
    async queryKnowledge(query) {
        try {
            const results = await kg.queryKnowledge(query);
            // Parse results into structured format
            const entities = [];
            const relations = [];
            const facts = [];
            for (const result of results) {
                if (result.s) {
                    entities.push({
                        id: result.s.properties.id,
                        type: result.s.properties.type,
                        properties: result.s.properties,
                    });
                }
                if (result.o) {
                    entities.push({
                        id: result.o.properties.id,
                        type: result.o.properties.type,
                        properties: result.o.properties,
                    });
                }
                if (result.r) {
                    relations.push({
                        from: result.s?.properties.id,
                        to: result.o?.properties.id,
                        type: result.r.type,
                        properties: result.r.properties,
                    });
                }
            }
            logger.info('Queried knowledge', {
                entityId: query.entityId,
                resultCount: results.length,
            });
            return { entities, relations, facts };
        }
        catch (error) {
            logger.error('Failed to query knowledge', error);
            throw error;
        }
    }
    /**
     * Traverse knowledge graph
     */
    async traverseGraph(startNodeId, depth) {
        try {
            const paths = await kg.traverseGraph(startNodeId, depth);
            logger.info('Traversed graph', { startNodeId, depth, pathCount: paths.length });
            return paths;
        }
        catch (error) {
            logger.error('Failed to traverse graph', error, { startNodeId, depth });
            throw error;
        }
    }
    /**
     * Search semantic memories by vector similarity
     */
    async searchSemanticMemories(agentId, queryText, topK = 10, category) {
        try {
            // Generate query embedding
            const embeddingClient = (0, shared_2.getEmbeddingClient)();
            const queryEmbedding = await embeddingClient.generateEmbedding(queryText);
            // Build filter
            const filter = {
                must: [{ key: 'agent_id', match: { value: agentId } }],
            };
            if (category) {
                filter.must.push({ key: 'category', match: { value: category } });
            }
            // Search vector database
            const results = await vectorDb.vectorSearch({
                collection: vectorDb.COLLECTIONS.SEMANTIC_MEMORIES,
                vector: queryEmbedding,
                limit: topK,
                filter,
            });
            logger.info('Searched semantic memories', {
                agentId,
                queryLength: queryText.length,
                resultCount: results.length,
            });
            return results.map((r) => ({
                id: r.id,
                content: r.payload.content,
                score: r.score,
                source: r.payload.source,
            }));
        }
        catch (error) {
            logger.error('Failed to search semantic memories', error, { agentId });
            throw error;
        }
    }
    /**
     * Export subgraph for visualization
     */
    async exportSubgraph(entityId, depth = 2) {
        try {
            const paths = await this.traverseGraph(entityId, depth);
            const nodesMap = new Map();
            const edges = [];
            for (const path of paths) {
                for (const node of path.nodes) {
                    if (node.id) {
                        nodesMap.set(node.id, node);
                    }
                }
                edges.push(...path.relationships);
            }
            const nodes = Array.from(nodesMap.values());
            logger.info('Exported subgraph', { entityId, depth, nodeCount: nodes.length });
            return { nodes, edges };
        }
        catch (error) {
            logger.error('Failed to export subgraph', error, { entityId });
            throw error;
        }
    }
    /**
     * Get semantic memory statistics
     */
    async getStats(agentId) {
        try {
            const prisma = (0, database_1.getPrismaClient)();
            const memories = await prisma.memoryIndex.findMany({
                where: {
                    agentId,
                    memoryType: 'semantic',
                },
                select: {
                    metadata: true,
                },
            });
            const byCategory = {};
            const bySource = {};
            for (const memory of memories) {
                const meta = memory.metadata;
                const category = meta?.category || 'unknown';
                const source = meta?.source || 'unknown';
                byCategory[category] = (byCategory[category] || 0) + 1;
                bySource[source] = (bySource[source] || 0) + 1;
            }
            return {
                totalMemories: memories.length,
                byCategory,
                bySource,
            };
        }
        catch (error) {
            logger.error('Failed to get semantic memory stats', error, { agentId });
            throw error;
        }
    }
}
exports.SemanticMemoryEngine = SemanticMemoryEngine;
// Singleton instance
let semanticMemoryEngine;
function getSemanticMemoryEngine() {
    if (!semanticMemoryEngine) {
        semanticMemoryEngine = new SemanticMemoryEngine();
    }
    return semanticMemoryEngine;
}
//# sourceMappingURL=semantic-memory-engine.js.map