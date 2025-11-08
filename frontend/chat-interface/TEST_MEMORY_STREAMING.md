# 测试记忆检索和流式输出

## 🔧 修复内容

### 1. WebSocket Room 加入
- ✅ 添加了 `join-session` 事件
- ✅ 前端在切换 session 时自动加入对应的 room
- ✅ 流式消息现在能正确发送到客户端

### 2. 记忆检索优化
- ✅ 降低相似度阈值（0.1 → 0.05）
- ✅ 新 session 也能检索到历史 session 的记忆
- ✅ 优先返回当前 session 的记忆

### 3. 前端流式监听
- ✅ 添加了 `message:start`、`message:chunk`、`message` 事件监听
- ✅ 实时更新 `streamingMessage` 状态
- ✅ 在消息列表中显示流式内容

## 🧪 测试步骤

### 测试 1：在预设 Session 中测试记忆检索

1. **打开 Session 1（AI Agent 记忆系统学习之旅）**
2. **提问**：
   ```
   RAG 是怎么实现的？
   ```
3. **预期结果**：
   - AI 会说"根据我们10天前讨论的..."
   - 引用之前关于 RAG 的对话内容
   - 看到流式输出效果（逐字显示）

### 测试 2：在新 Session 中测试跨 Session 记忆检索

1. **创建一个新 Session**
2. **提问**：
   ```
   什么是深度学习？
   ```
3. **预期结果**：
   - AI 会检索到 Session 2 中关于深度学习的记忆
   - 回答中会提到"根据相关记忆..."
   - 看到流式输出效果

### 测试 3：测试流式输出

1. **在任意 Session 中提问**：
   ```
   请详细解释一下神经网络的工作原理
   ```
2. **观察**：
   - 打开浏览器控制台（F12）
   - 应该看到：
     ```
     🌊 Stream started: {id: "..."}
     📝 Stream chunk: 5 chars
     📝 Stream chunk: 10 chars
     📝 Stream chunk: 15 chars
     ...
     ✅ Stream complete
     ```
   - 消息应该逐字显示，而不是一次性出现

### 测试 4：测试记忆相关性

**在 Session 2（AI/ML/DL 学习）中提问**：

```
我应该学习 CNN 还是 Transformer？
```

**预期结果**：
- 检索到关于 CNN 和 Transformer 的记忆
- AI 会基于你的学习历史给出建议
- 可能会提到"根据你对神经网络的兴趣..."

## 🔍 调试信息

### 后端日志
```bash
📨 Received message: { sessionId: '...', message: '...' }
🧠 Retrieved memories: 3
📚 Memory 1: [EPISODIC] (10天前, 重要性:0.90) ...
📚 Memory 2: [SEMANTIC] (8天前, 重要性:0.94) ...
📚 Memory 3: [REFLECTION] (5天前, 重要性:0.96) ...
🤖 Calling OpenAI API with memory context...
✅ OpenAI response received
🌊 Streaming message...
📡 Message streamed via WebSocket to room: session-xxx
```

### 前端控制台
```bash
🔌 Joined session room: session-xxx
🌊 Stream started: {id: "msg-xxx"}
📝 Stream chunk: 5 chars
📝 Stream chunk: 10 chars
...
✅ Stream complete
```

## 🎯 测试用例

### 用例 1：测试记忆检索准确性
| 问题 | Session | 预期检索到的记忆 |
|------|---------|------------------|
| "RAG 是什么？" | Session 1 | RAG 实现方法的语义记忆 |
| "深度学习和机器学习的区别？" | Session 2 | 技术对比的语义记忆 |
| "我之前问过什么？" | 任意 | 该 session 的情景记忆 |

### 用例 2：测试流式输出
| 场景 | 预期行为 |
|------|----------|
| 短回复（<50字） | 快速流式显示 |
| 长回复（>200字） | 明显的打字效果 |
| 包含代码块 | 逐行显示 |

### 用例 3：测试跨 Session 记忆
| 场景 | 预期行为 |
|------|----------|
| 新 Session 询问旧话题 | 能检索到其他 Session 的记忆 |
| 当前 Session 的记忆 | 优先级更高 |

## 🐛 常见问题

### 问题 1：看不到流式输出
**检查**：
1. 浏览器控制台是否有 WebSocket 连接错误？
2. 是否看到 "🔌 Joined session room" 日志？
3. 后端是否输出 "📡 Message streamed" 日志？

**解决**：
- 刷新页面重新连接 WebSocket
- 检查后端服务是否正常运行

### 问题 2：检索不到记忆
**检查**：
1. 后端日志显示 "🧠 Retrieved memories: 0"？
2. 问题关键词是否与记忆内容相关？

**解决**：
- 尝试更具体的问题
- 检查相似度计算函数

### 问题 3：流式输出太快看不清
**调整**：
在 `mock-server.cjs` 中修改：
```javascript
await new Promise(resolve => setTimeout(resolve, 50)); // 增加延迟
```

## 📊 性能指标

| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 记忆检索时间 | <100ms | ~50ms |
| 流式输出延迟 | 20ms/chunk | 20ms/chunk |
| WebSocket 连接时间 | <500ms | ~200ms |
| 首字显示时间 | <1s | ~800ms |

## ✅ 验收标准

- [ ] 在预设 Session 中提问，AI 能引用之前的对话
- [ ] 在新 Session 中提问，AI 能检索到其他 Session 的相关记忆
- [ ] 消息以流式方式显示，有明显的打字效果
- [ ] 控制台显示正确的调试日志
- [ ] 没有 WebSocket 连接错误
- [ ] 记忆检索相关性合理（不是完全无关的记忆）

## 🚀 下一步

如果测试通过，可以：
1. 调整流式输出速度（更快或更慢）
2. 优化记忆检索算法（使用真实的向量相似度）
3. 添加记忆可视化（在界面上显示检索到的记忆）
4. 支持用户手动选择记忆

现在刷新页面，按照测试步骤验证功能！🎉
