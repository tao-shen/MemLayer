// Entity
export interface Entity {
  id?: string;
  type: string;
  properties: Record<string, any>;
}

// Relation
export interface Relation {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

// Fact (triple)
export interface Fact {
  subject: string;
  predicate: string;
  object: string;
  confidence?: number;
  source?: string;
}

// Knowledge query
export interface KnowledgeQuery {
  pattern?: Fact;
  entityId?: string;
  queryText?: string;
  depth?: number;
}

// Knowledge result
export interface KnowledgeResult {
  entities: Entity[];
  relations: Relation[];
  facts: Fact[];
}

// Graph path
export interface GraphPath {
  nodes: Entity[];
  relationships: Relation[];
}
