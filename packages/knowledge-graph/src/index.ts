import neo4j, { Driver, Session, auth } from 'neo4j-driver';

// Neo4j driver singleton
let driver: Driver;

export interface Neo4jConfig {
  uri?: string;
  user?: string;
  password?: string;
}

export function getNeo4jDriver(config?: Neo4jConfig): Driver {
  if (!driver) {
    const uri = config?.uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = config?.user || process.env.NEO4J_USER || 'neo4j';
    const password = config?.password || process.env.NEO4J_PASSWORD || 'neo4j_password';

    driver = neo4j.driver(uri, auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2000,
    });
  }
  return driver;
}

export function getSession(): Session {
  return getNeo4jDriver().session();
}

// Close driver
export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
  }
}

// Entity operations
export interface Entity {
  id?: string;
  type: string;
  properties: Record<string, any>;
}

export async function createEntity(entity: Entity): Promise<string> {
  const session = getSession();
  try {
    const id = entity.id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await session.run(
      `
      CREATE (e:Entity {id: $id, type: $type})
      SET e += $properties
      SET e.created_at = datetime()
      RETURN e.id as id
      `,
      {
        id,
        type: entity.type,
        properties: entity.properties,
      }
    );
    return result.records[0].get('id');
  } finally {
    await session.close();
  }
}

export async function getEntity(id: string): Promise<Entity | null> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (e:Entity {id: $id})
      RETURN e
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get('e');
    return {
      id: node.properties.id,
      type: node.properties.type,
      properties: node.properties,
    };
  } finally {
    await session.close();
  }
}

export async function updateEntity(id: string, properties: Record<string, any>): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (e:Entity {id: $id})
      SET e += $properties
      SET e.updated_at = datetime()
      `,
      { id, properties }
    );
  } finally {
    await session.close();
  }
}

export async function deleteEntity(id: string): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (e:Entity {id: $id})
      DETACH DELETE e
      `,
      { id }
    );
  } finally {
    await session.close();
  }
}

// Relation operations
export interface Relation {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

export async function createRelation(relation: Relation): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (from:Entity {id: $from})
      MATCH (to:Entity {id: $to})
      CREATE (from)-[r:${relation.type}]->(to)
      SET r += $properties
      SET r.created_at = datetime()
      `,
      {
        from: relation.from,
        to: relation.to,
        properties: relation.properties || {},
      }
    );
  } finally {
    await session.close();
  }
}

export async function deleteRelation(from: string, to: string, type: string): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (from:Entity {id: $from})-[r:${type}]->(to:Entity {id: $to})
      DELETE r
      `,
      { from, to }
    );
  } finally {
    await session.close();
  }
}

// Fact operations (triple)
export interface Fact {
  subject: string;
  predicate: string;
  object: string;
  confidence?: number;
  source?: string;
}

export async function storeFact(fact: Fact): Promise<void> {
  const session = getSession();
  try {
    // Ensure subject and object entities exist
    await session.run(
      `
      MERGE (s:Entity {id: $subject})
      ON CREATE SET s.type = 'Unknown', s.created_at = datetime()
      MERGE (o:Entity {id: $object})
      ON CREATE SET o.type = 'Unknown', o.created_at = datetime()
      `,
      { subject: fact.subject, object: fact.object }
    );

    // Create relationship
    await session.run(
      `
      MATCH (s:Entity {id: $subject})
      MATCH (o:Entity {id: $object})
      MERGE (s)-[r:${fact.predicate}]->(o)
      SET r.confidence = $confidence
      SET r.source = $source
      SET r.created_at = datetime()
      `,
      {
        subject: fact.subject,
        object: fact.object,
        confidence: fact.confidence || 1.0,
        source: fact.source || 'unknown',
      }
    );
  } finally {
    await session.close();
  }
}

// Query operations
export interface GraphQuery {
  pattern?: Fact;
  entityId?: string;
  depth?: number;
}

export async function queryKnowledge(query: GraphQuery): Promise<any[]> {
  const session = getSession();
  try {
    if (query.entityId) {
      // Query by entity ID
      const result = await session.run(
        `
        MATCH (e:Entity {id: $entityId})-[r*1..${query.depth || 1}]-(related)
        RETURN e, r, related
        `,
        { entityId: query.entityId }
      );
      return result.records.map((record) => record.toObject());
    } else if (query.pattern) {
      // Query by pattern
      const result = await session.run(
        `
        MATCH (s:Entity {id: $subject})-[r:${query.pattern.predicate}]->(o:Entity {id: $object})
        RETURN s, r, o
        `,
        {
          subject: query.pattern.subject,
          object: query.pattern.object,
        }
      );
      return result.records.map((record) => record.toObject());
    }
    return [];
  } finally {
    await session.close();
  }
}

// Graph traversal
export interface GraphPath {
  nodes: Entity[];
  relationships: Relation[];
}

export async function traverseGraph(startNodeId: string, depth: number): Promise<GraphPath[]> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH path = (start:Entity {id: $startNodeId})-[*1..${depth}]-(end)
      RETURN path
      LIMIT 100
      `,
      { startNodeId }
    );

    return result.records.map((record) => {
      const path = record.get('path');
      return {
        nodes: path.segments.map((seg: any) => ({
          id: seg.start.properties.id,
          type: seg.start.properties.type,
          properties: seg.start.properties,
        })),
        relationships: path.segments.map((seg: any) => ({
          from: seg.start.properties.id,
          to: seg.end.properties.id,
          type: seg.relationship.type,
          properties: seg.relationship.properties,
        })),
      };
    });
  } finally {
    await session.close();
  }
}

// Cypher query builder
export class CypherQueryBuilder {
  private query: string = '';
  private params: Record<string, any> = {};

  match(pattern: string): this {
    this.query += `MATCH ${pattern}\n`;
    return this;
  }

  where(condition: string): this {
    this.query += `WHERE ${condition}\n`;
    return this;
  }

  create(pattern: string): this {
    this.query += `CREATE ${pattern}\n`;
    return this;
  }

  merge(pattern: string): this {
    this.query += `MERGE ${pattern}\n`;
    return this;
  }

  set(assignments: string): this {
    this.query += `SET ${assignments}\n`;
    return this;
  }

  return(fields: string): this {
    this.query += `RETURN ${fields}\n`;
    return this;
  }

  limit(count: number): this {
    this.query += `LIMIT ${count}\n`;
    return this;
  }

  withParams(params: Record<string, any>): this {
    this.params = { ...this.params, ...params };
    return this;
  }

  async execute(): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(this.query, this.params);
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  build(): { query: string; params: Record<string, any> } {
    return { query: this.query, params: this.params };
  }
}

// Health check
export async function checkKnowledgeGraphHealth(): Promise<boolean> {
  const session = getSession();
  try {
    await session.run('RETURN 1');
    return true;
  } catch (error) {
    console.error('Knowledge graph health check failed:', error);
    return false;
  } finally {
    await session.close();
  }
}

export { Driver, Session };
