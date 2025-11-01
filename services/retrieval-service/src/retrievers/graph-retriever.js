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
exports.GraphRetriever = void 0;
exports.getGraphRetriever = getGraphRetriever;
const kg = __importStar(require("@agent-memory/knowledge-graph"));
const shared_1 = require("@agent-memory/shared");
const logger = (0, shared_1.createLogger)('GraphRetriever');
class GraphRetriever {
    /**
     * Retrieve entities and relationships from knowledge graph
     */
    async retrieve(params) {
        try {
            const { entityId, depth = 1, limit = 100 } = params;
            if (!entityId) {
                throw new Error('entityId is required for graph retrieval');
            }
            // Traverse graph
            const paths = await kg.traverseGraph(entityId, depth);
            // Extract unique entities and relations
            const entitiesMap = new Map();
            const relationsSet = new Set();
            const relations = [];
            for (const path of paths.slice(0, limit)) {
                for (const node of path.nodes) {
                    if (node.id) {
                        entitiesMap.set(node.id, node);
                    }
                }
                for (const rel of path.relationships) {
                    const key = `${rel.from}-${rel.type}-${rel.to}`;
                    if (!relationsSet.has(key)) {
                        relationsSet.add(key);
                        relations.push(rel);
                    }
                }
            }
            const entities = Array.from(entitiesMap.values());
            logger.info('Graph retrieval completed', {
                entityId,
                depth,
                entityCount: entities.length,
                relationCount: relations.length,
            });
            return { entities, relations };
        }
        catch (error) {
            logger.error('Graph retrieval failed', error, {
                entityId: params.entityId,
            });
            throw error;
        }
    }
    /**
     * Find paths between two entities
     */
    async findPaths(fromEntityId, toEntityId, maxDepth = 3) {
        try {
            const session = kg.getSession();
            const result = await session.run(`
        MATCH path = shortestPath(
          (from:Entity {id: $fromId})-[*1..${maxDepth}]-(to:Entity {id: $toId})
        )
        RETURN path
        LIMIT 10
        `, { fromId: fromEntityId, toId: toEntityId });
            await session.close();
            const paths = result.records.map((record) => {
                const path = record.get('path');
                return {
                    nodes: path.segments.map((seg) => ({
                        id: seg.start.properties.id,
                        type: seg.start.properties.type,
                        properties: seg.start.properties,
                    })),
                    relationships: path.segments.map((seg) => ({
                        from: seg.start.properties.id,
                        to: seg.end.properties.id,
                        type: seg.relationship.type,
                        properties: seg.relationship.properties,
                    })),
                };
            });
            logger.info('Found paths between entities', {
                from: fromEntityId,
                to: toEntityId,
                pathCount: paths.length,
            });
            return paths;
        }
        catch (error) {
            logger.error('Path finding failed', error, {
                from: fromEntityId,
                to: toEntityId,
            });
            throw error;
        }
    }
    /**
     * Retrieve entities by type
     */
    async retrieveByType(entityType, limit = 100) {
        try {
            const session = kg.getSession();
            const result = await session.run(`
        MATCH (e:Entity {type: $type})
        RETURN e
        LIMIT $limit
        `, { type: entityType, limit });
            await session.close();
            const entities = result.records.map((record) => {
                const node = record.get('e');
                return {
                    id: node.properties.id,
                    type: node.properties.type,
                    properties: node.properties,
                };
            });
            logger.info('Retrieved entities by type', {
                type: entityType,
                count: entities.length,
            });
            return entities;
        }
        catch (error) {
            logger.error('Type-based retrieval failed', error, { type: entityType });
            throw error;
        }
    }
    /**
     * Retrieve related entities
     */
    async retrieveRelated(entityId, relationshipType, direction = 'both') {
        try {
            const session = kg.getSession();
            let pattern = '';
            if (direction === 'outgoing') {
                pattern = relationshipType
                    ? `(e:Entity {id: $entityId})-[r:${relationshipType}]->(related)`
                    : `(e:Entity {id: $entityId})-[r]->(related)`;
            }
            else if (direction === 'incoming') {
                pattern = relationshipType
                    ? `(related)-[r:${relationshipType}]->(e:Entity {id: $entityId})`
                    : `(related)-[r]->(e:Entity {id: $entityId})`;
            }
            else {
                pattern = relationshipType
                    ? `(e:Entity {id: $entityId})-[r:${relationshipType}]-(related)`
                    : `(e:Entity {id: $entityId})-[r]-(related)`;
            }
            const result = await session.run(`
        MATCH ${pattern}
        RETURN related, r
        LIMIT 100
        `, { entityId });
            await session.close();
            const results = result.records.map((record) => {
                const relatedNode = record.get('related');
                const relationship = record.get('r');
                return {
                    entity: {
                        id: relatedNode.properties.id,
                        type: relatedNode.properties.type,
                        properties: relatedNode.properties,
                    },
                    relationship: {
                        from: relationship.start.toString(),
                        to: relationship.end.toString(),
                        type: relationship.type,
                        properties: relationship.properties,
                    },
                };
            });
            logger.info('Retrieved related entities', {
                entityId,
                relationshipType,
                direction,
                count: results.length,
            });
            return results;
        }
        catch (error) {
            logger.error('Related entities retrieval failed', error, { entityId });
            throw error;
        }
    }
    /**
     * Execute custom Cypher query
     */
    async executeQuery(cypherQuery, params = {}) {
        try {
            const session = kg.getSession();
            const result = await session.run(cypherQuery, params);
            await session.close();
            const results = result.records.map((record) => record.toObject());
            logger.info('Executed custom Cypher query', {
                resultCount: results.length,
            });
            return results;
        }
        catch (error) {
            logger.error('Custom query execution failed', error);
            throw error;
        }
    }
}
exports.GraphRetriever = GraphRetriever;
// Singleton instance
let graphRetriever;
function getGraphRetriever() {
    if (!graphRetriever) {
        graphRetriever = new GraphRetriever();
    }
    return graphRetriever;
}
//# sourceMappingURL=graph-retriever.js.map