// Simple Mock API Server for development
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5174',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Mock data
const sessions = [];
const messages = {};

// Sessions API
app.get('/v1/agents/:agentId/sessions', (req, res) => {
  res.json({ data: sessions, success: true });
});

app.post('/v1/agents/:agentId/sessions', (req, res) => {
  const session = {
    id: `session-${Date.now()}`,
    agentId: req.params.agentId,
    userId: 'demo-user',
    name: req.body.name || `Session ${sessions.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    messageCount: 0,
    config: req.body.config || {
      agentType: 'general',
      ragMode: 'off',
      memoryTypes: ['stm', 'episodic'],
      autoReflection: false,
      blockchainEnabled: false,
    },
  };
  sessions.push(session);
  messages[session.id] = [];
  res.json({ data: session, success: true });
});

app.delete('/v1/agents/:agentId/sessions/:sessionId', (req, res) => {
  const index = sessions.findIndex((s) => s.id === req.params.sessionId);
  if (index !== -1) {
    sessions.splice(index, 1);
    delete messages[req.params.sessionId];
  }
  res.json({ success: true });
});

app.put('/v1/agents/:agentId/sessions/:sessionId', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.sessionId);
  if (session) {
    session.name = req.body.name;
    session.updatedAt = new Date().toISOString();
  }
  res.json(session);
});

// Messages API
app.get('/v1/agents/:agentId/sessions/:sessionId/messages', (req, res) => {
  const sessionMessages = messages[req.params.sessionId] || [];
  res.json({
    data: sessionMessages,
    total: sessionMessages.length,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
});

app.post('/v1/agents/:agentId/chat', (req, res) => {
  const { sessionId, message } = req.body;
  
  // Add user message
  const userMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };
  
  if (!messages[sessionId]) {
    messages[sessionId] = [];
  }
  messages[sessionId].push(userMessage);
  
  // Simulate AI response
  setTimeout(() => {
    const aiMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `This is a mock response to: "${message}". The backend API is not running, so this is just a demo response.`,
      timestamp: new Date().toISOString(),
    };
    messages[sessionId].push(aiMessage);
    
    // Emit via WebSocket
    io.to(sessionId).emit('message', aiMessage);
  }, 500);
  
  res.json({
    data: {
      messageId: userMessage.id,
      response: 'Processing...',
      memoriesCreated: [],
      ragResults: [],
    },
    success: true,
  });
});

// Memories API
app.get('/v1/agents/:agentId/memories', (req, res) => {
  res.json({
    data: [],
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
});

// Visualization API
app.get('/v1/agents/:agentId/visualization/timeline', (req, res) => {
  res.json([]);
});

app.get('/v1/agents/:agentId/visualization/graph', (req, res) => {
  res.json({ nodes: [], edges: [] });
});

app.get('/v1/agents/:agentId/visualization/statistics', (req, res) => {
  res.json({
    memoryStats: {
      total: 0,
      byType: { stm: 0, episodic: 0, semantic: 0, reflection: 0 },
      byImportance: [],
    },
    trendData: [],
    topMemories: [],
    topEntities: [],
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join', (agentId) => {
    console.log('Agent joined:', agentId);
    socket.join(agentId);
    socket.emit('connected', { agentId });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});
