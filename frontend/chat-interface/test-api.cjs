// Test script to verify API endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const AGENT_ID = 'demo-agent-001';

async function test() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // 1. Create a session
    console.log('1️⃣ Creating session...');
    const sessionResponse = await axios.post(`${API_BASE}/v1/agents/${AGENT_ID}/sessions`, {
      name: 'Test Session',
      config: {
        agentType: 'default',
        ragMode: 'off',
        memoryTypes: ['stm'],
        autoReflection: false,
        blockchainEnabled: false,
      },
    });
    console.log('✅ Session created:', sessionResponse.data);
    const sessionId = sessionResponse.data.data.id;

    // 2. Send a message
    console.log('\n2️⃣ Sending message...');
    const messageResponse = await axios.post(`${API_BASE}/v1/agents/${AGENT_ID}/chat`, {
      sessionId: sessionId,
      message: 'Hello, this is a test message!',
      ragMode: 'off',
    });
    console.log('✅ Message sent:', messageResponse.data);

    // 3. Wait a bit for AI response
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4. Get messages
    console.log('\n3️⃣ Getting messages...');
    const messagesResponse = await axios.get(
      `${API_BASE}/v1/agents/${AGENT_ID}/sessions/${sessionId}/messages`
    );
    console.log('✅ Messages retrieved:', messagesResponse.data);
    console.log('\n📝 Message contents:');
    messagesResponse.data.data.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}]: ${msg.content}`);
    });

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

test();
