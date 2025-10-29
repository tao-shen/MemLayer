// Agent Memory Platform - Neo4j Initialization Script

// Create constraints for unique IDs
CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE;

// Create indexes for performance
CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type);
CREATE INDEX concept_name IF NOT EXISTS FOR (c:Concept) ON (c.name);
CREATE INDEX agent_name IF NOT EXISTS FOR (a:Agent) ON (a.name);

// Create sample test agent
MERGE (a:Agent {id: '00000000-0000-0000-0000-000000000001'})
SET a.name = 'Test Agent',
    a.created_at = datetime();

// Create sample entities and relationships for testing
MERGE (e1:Entity {id: 'entity-001'})
SET e1.type = 'Person',
    e1.properties = {name: 'John Doe', age: 30},
    e1.created_at = datetime();

MERGE (e2:Entity {id: 'entity-002'})
SET e2.type = 'Organization',
    e2.properties = {name: 'Acme Corp'},
    e2.created_at = datetime();

MERGE (e1)-[:WORKS_AT {since: date('2020-01-01')}]->(e2);

MERGE (c1:Concept {id: 'concept-001'})
SET c1.name = 'Artificial Intelligence',
    c1.description = 'The simulation of human intelligence by machines',
    c1.created_at = datetime();

MERGE (c2:Concept {id: 'concept-002'})
SET c2.name = 'Machine Learning',
    c2.description = 'A subset of AI focused on learning from data',
    c2.created_at = datetime();

MERGE (c2)-[:IS_A {confidence: 0.95}]->(c1);
