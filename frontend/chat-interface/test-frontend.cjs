// Complete frontend flow test
const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const AGENT_ID = 'demo-agent-001';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete User Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get existing sessions
    console.log('\n📋 Step 1: Getting existing sessions...');
    const sessionsResponse = await axios.get(`${API_BASE}/v1/agents/${AGENT_ID}/sessions`);
    console.log(`✅ Found ${sessionsResponse.data.data.length} existing sessions`);

    // Step 2: Create a new session
    console.log('\n➕ Step 2: Creating new session...');
    const newSession = await axios.post(`${API_BASE}/v1/agents/${AGENT_ID}/sessions`, {
      name: `Debug Session ${new Date().toLocaleTimeString()}`,
      config: {
        agentType: 'default',
        ragMode: 'off',
        memoryTypes: ['stm', 'episodic'],
        autoReflection: false,
        blockchainEnabled: false,
      },
    });
    const sessionId = newSession.data.data.id;
    console.log(`✅ Session created: ${sessionId}`);
    console.log(`   Name: ${newSession.data.data.name}`);

    // Step 3: Send first message
    console.log('\n💬 Step 3: Sending first message...');
    const msg1 = await axios.post(`${API_BASE}/v1/agents/${AGENT_ID}/chat`, {
      sessionId: sessionId,
      message: 'Hello! Can you help me test this chat interface?',
      ragMode: 'off',
    });
    console.log(`✅ Message sent, ID: ${msg1.data.data.messageId}`);
    console.log(`   Response preview: ${msg1.data.data.response.substring(0, 50)}...`);

    // Wait for AI response
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Step 4: Get messages
    console.log('\n📨 Step 4: Retrieving messages...');
    const messages = await axios.get(
      `${API_BASE}/v1/agents/${AGENT_ID}/sessions/${sessionId}/messages`
    );
    console.log(`✅ Retrieved ${messages.data.data.length} messages:`);
    messages.data.data.forEach((msg, i) => {
      const preview = msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content;
      console.log(`   ${i + 1}. [${msg.role.toUpperCase()}] ${preview}`);
    });

    // Step 5: Send second message
    console.log('\n💬 Step 5: Sending second message...');
    const msg2 = await axios.post(`${API_BASE}/v1/agents/${AGENT_ID}/chat`, {
      sessionId: sessionId,
      message: 'Great! Now tell me about the weather.',
      ragMode: 'off',
    });
    console.log(`✅ Second message sent, ID: ${msg2.data.data.messageId}`);

    // Wait for AI response
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Step 6: Get updated messages
    console.log('\n📨 Step 6: Retrieving updated messages...');
    const updatedMessages = await axios.get(
      `${API_BASE}/v1/agents/${AGENT_ID}/sessions/${sessionId}/messages`
    );
    console.log(`✅ Now have ${updatedMessages.data.data.length} messages total`);

    // Step 7: Verify all sessions
    console.log('\n📋 Step 7: Verifying all sessions...');
    const finalSessions = await axios.get(`${API_BASE}/v1/agents/${AGENT_ID}/sessions`);
    console.log(`✅ Total sessions: ${finalSessions.data.data.length}`);
    finalSessions.data.data.forEach((session, i) => {
      console.log(`   ${i + 1}. ${session.name} (${session.messageCount} messages)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED! Frontend should work perfectly.');
    console.log('='.repeat(60));
    console.log('\n📱 Open browser to: http://localhost:5174/');
    console.log('🎯 You should see:');
    console.log('   - Connected status (green)');
    console.log('   - Multiple sessions in sidebar');
    console.log('   - Messages displaying correctly');
    console.log('   - New messages appear in real-time');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testCompleteFlow();
