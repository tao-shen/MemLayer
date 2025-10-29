-- Agent Memory Platform Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    agent_id UUID,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    details JSONB DEFAULT '{}'
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_agent_id ON audit_logs(agent_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Memory index table (for quick lookups and metadata)
CREATE TABLE IF NOT EXISTS memory_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL,
    storage_location VARCHAR(255) NOT NULL,
    importance DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_memory_index_agent_id ON memory_index(agent_id);
CREATE INDEX idx_memory_index_type ON memory_index(memory_type);
CREATE INDEX idx_memory_index_importance ON memory_index(importance DESC);
CREATE INDEX idx_memory_index_created_at ON memory_index(created_at DESC);
CREATE INDEX idx_memory_index_accessed_at ON memory_index(accessed_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for agents table
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin agent for testing
INSERT INTO agents (id, user_id, name, config) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Test Agent', 
     '{"stmWindowSize": 10, "embeddingModel": "text-embedding-3-small", "reflectionThreshold": 50}')
ON CONFLICT (id) DO NOTHING;

COMMIT;
