// Simple Mock API Server for development
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

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

// ========== Session 1: AI Agent 开发学习 ==========
const mockConversationHistory = [
  {
    id: 'msg-1',
    role: 'user',
    content: '我想开发一个具有记忆能力的 AI Agent，应该从哪里开始？',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: '开发具有记忆能力的 AI Agent 是一个很有意思的方向！我建议从以下几个方面入手：\n\n1. **理解记忆系统架构**：学习短期记忆(STM)、情景记忆(Episodic)、语义记忆(Semantic)和反思记忆(Reflection)的区别\n2. **选择技术栈**：推荐使用 LangChain 或 LlamaIndex 作为框架，配合向量数据库如 Pinecone 或 Weaviate\n3. **实现 RAG**：检索增强生成是记忆系统的核心\n\n你对哪个方面最感兴趣？',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-3',
    role: 'user',
    content: '我对记忆系统的架构很感兴趣，能详细解释一下这四种记忆类型吗？',
    timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: '当然！这四种记忆类型模拟了人类的认知过程：\n\n**短期记忆 (STM)**：存储当前对话上下文，生命周期短，通常在会话结束后清除。\n\n**情景记忆 (Episodic)**：记录具体的交互事件，如"用户在2024年1月询问了关于Python的问题"。包含时间、地点、情境等信息。\n\n**语义记忆 (Semantic)**：存储抽象的知识和概念，如"Python是一种编程语言"。不依赖特定情境。\n\n**反思记忆 (Reflection)**：Agent对过往经验的总结和洞察，如"用户倾向于通过实践学习"。这是最高层次的记忆。',
    timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-5',
    role: 'user',
    content: '那向量数据库在这里扮演什么角色？为什么需要它？',
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-6',
    role: 'assistant',
    content: '向量数据库是记忆系统的核心基础设施！\n\n它的作用是：\n1. **语义搜索**：将文本转换为向量(embeddings)，通过相似度检索相关记忆\n2. **高效存储**：处理大规模记忆数据，支持快速查询\n3. **关联发现**：找出看似无关但语义相近的记忆\n\n工作流程：\n用户输入 → Embedding模型 → 向量 → 在向量数据库中搜索相似向量 → 检索相关记忆 → 提供给LLM作为上下文',
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-7',
    role: 'user',
    content: '我看到你提到了 RAG，能具体说说如何实现吗？',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-8',
    role: 'assistant',
    content: 'RAG (Retrieval-Augmented Generation) 的实现步骤：\n\n```python\n# 1. 索引阶段\ndocuments = load_documents()\nembeddings = embedding_model.encode(documents)\nvector_db.store(embeddings)\n\n# 2. 检索阶段\nquery_embedding = embedding_model.encode(user_query)\nrelevant_docs = vector_db.search(query_embedding, top_k=5)\n\n# 3. 生成阶段\ncontext = format_context(relevant_docs)\nresponse = llm.generate(context + user_query)\n```\n\n关键点：\n- Chunk size 的选择（通常 512-1024 tokens）\n- 检索策略（相似度阈值、top-k）\n- 重排序（reranking）提升相关性',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-9',
    role: 'user',
    content: '我在想，如何让 Agent 能够"反思"自己的经验？这个机制是怎么实现的？',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-10',
    role: 'assistant',
    content: '反思机制是 Agent 智能的关键！实现方式：\n\n**触发条件**：\n- 定期触发（如每10次交互）\n- 重要事件触发（用户表达不满、任务失败）\n- 主动触发（Agent检测到模式）\n\n**反思过程**：\n1. 检索最近的情景记忆\n2. 让 LLM 分析这些记忆，提取模式和洞察\n3. 生成高层次的反思记忆\n4. 更新 Agent 的行为策略\n\n例如：从"用户3次询问Python问题"反思出"用户正在学习Python，应该提供更多实践建议"',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-11',
    role: 'user',
    content: '这个项目看起来挺复杂的，有没有现成的框架可以用？',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-12',
    role: 'assistant',
    content: '有几个不错的选择：\n\n**LangChain**：\n- 最流行的 LLM 应用框架\n- 内置 Memory 模块和 RAG 支持\n- 丰富的集成（100+ 向量数据库、LLM）\n\n**LlamaIndex**：\n- 专注于数据索引和检索\n- 更适合构建知识密集型应用\n- 优秀的文档处理能力\n\n**MemGPT**：\n- 专门为长期记忆设计\n- 模拟操作系统的内存管理\n- 适合需要持久化记忆的场景\n\n我建议从 LangChain 开始，它的学习曲线相对平缓。',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-13',
    role: 'user',
    content: '好的，我准备开始动手了。能给我一个最小可行的代码示例吗？',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-14',
    role: 'assistant',
    content: '当然！这是一个使用 LangChain 的最小示例：\n\n```python\nfrom langchain.memory import ConversationBufferMemory\nfrom langchain.chains import ConversationChain\nfrom langchain.llms import OpenAI\n\n# 初始化记忆\nmemory = ConversationBufferMemory()\n\n# 创建对话链\nconversation = ConversationChain(\n    llm=OpenAI(temperature=0.7),\n    memory=memory,\n    verbose=True\n)\n\n# 对话\nresponse1 = conversation.predict(input="我叫张三")\nresponse2 = conversation.predict(input="我叫什么名字？")\n# Agent 会记住你叫张三\n```\n\n这是最基础的，之后可以逐步添加向量存储、RAG 等功能。',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-15',
    role: 'user',
    content: '太好了！我会试试看。对了，如何评估记忆系统的效果？',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-16',
    role: 'assistant',
    content: '评估记忆系统可以从这几个维度：\n\n**检索质量**：\n- Precision@K：检索的前K个结果中相关的比例\n- Recall@K：相关记忆被检索到的比例\n- MRR (Mean Reciprocal Rank)：第一个相关结果的排名\n\n**记忆利用率**：\n- 记忆被访问的频率\n- 不同类型记忆的使用分布\n\n**用户体验**：\n- 对话连贯性\n- 个性化程度\n- 用户满意度\n\n**系统性能**：\n- 检索延迟\n- 存储成本\n\n建议建立 A/B 测试，对比有无记忆系统的效果差异。',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
  },
];

// ========== Session 2: AI/机器学习/深度学习知识学习 ==========
const mlConversationHistory = [
  {
    id: 'ml-msg-1',
    role: 'user',
    content: '我是一个编程新手，想了解什么是人工智能？它和机器学习有什么区别？',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-2',
    role: 'assistant',
    content: '很高兴你对 AI 感兴趣！让我用简单的方式解释：\n\n**人工智能 (AI)** 是一个大的概念，指让计算机模拟人类智能的技术。就像一个大伞，包含了很多子领域。\n\n**机器学习 (ML)** 是实现 AI 的一种方法，是 AI 的一个子集。它让计算机通过数据"学习"，而不是明确编程每一个规则。\n\n打个比方：\n- AI 是"让机器变聪明"的目标\n- 机器学习是"通过数据训练让机器变聪明"的方法\n\n例如：垃圾邮件过滤器用机器学习从大量邮件中学习什么是垃圾邮件，而不需要人工写规则。',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-3',
    role: 'user',
    content: '那深度学习又是什么？我经常听到这个词。',
    timestamp: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-4',
    role: 'assistant',
    content: '深度学习是机器学习的一个更专门的分支！\n\n**层级关系**：\nAI（最大）> 机器学习（中等）> 深度学习（最具体）\n\n**深度学习的特点**：\n- 使用"神经网络"，模仿人脑的结构\n- "深度"指网络有很多层（可能几十层甚至上百层）\n- 特别擅长处理图像、语音、文本等复杂数据\n\n**实际应用**：\n- 人脸识别（iPhone Face ID）\n- 语音助手（Siri、Alexa）\n- ChatGPT 这样的对话 AI\n- 自动驾驶汽车\n\n简单说：深度学习是机器学习中最强大但也最复杂的方法。',
    timestamp: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-5',
    role: 'user',
    content: '神经网络是怎么工作的？听起来很神奇。',
    timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-6',
    role: 'assistant',
    content: '神经网络确实很神奇！让我用一个识别猫的例子来解释：\n\n**基本结构**：\n1. **输入层**：接收图片的像素数据\n2. **隐藏层**：多层处理，每层学习不同特征\n   - 第1层：识别边缘和线条\n   - 第2层：识别形状（圆形、三角形）\n   - 第3层：识别部件（耳朵、眼睛、胡须）\n   - 第4层：组合成"猫"的概念\n3. **输出层**：给出结果（是猫/不是猫）\n\n**学习过程**：\n- 给它看成千上万张猫的图片\n- 每次预测错误，就调整内部参数\n- 反复训练，直到准确率很高\n\n就像小孩学认猫：看得越多，认得越准！',
    timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-7',
    role: 'user',
    content: '机器学习有哪些主要类型？我看到有监督学习、无监督学习这些术语。',
    timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-8',
    role: 'assistant',
    content: '很好的问题！机器学习主要有三大类型：\n\n**1. 监督学习 (Supervised Learning)**\n- 有"标准答案"的学习\n- 例子：给模型看标注好的猫狗图片，让它学会区分\n- 应用：垃圾邮件分类、房价预测、疾病诊断\n\n**2. 无监督学习 (Unsupervised Learning)**\n- 没有标准答案，让模型自己发现规律\n- 例子：给模型一堆客户数据，让它自己分组\n- 应用：客户细分、异常检测、推荐系统\n\n**3. 强化学习 (Reinforcement Learning)**\n- 通过"奖励"和"惩罚"学习\n- 例子：训练游戏 AI，赢了给奖励，输了给惩罚\n- 应用：AlphaGo、机器人控制、自动驾驶\n\n最常用的是监督学习，大约占 80% 的应用。',
    timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-9',
    role: 'user',
    content: '我想开始学习机器学习，需要什么基础知识？',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-10',
    role: 'assistant',
    content: '很棒的决定！这是我推荐的学习路径：\n\n**必备基础**：\n1. **编程**：Python（最流行的 ML 语言）\n   - 基础语法、数据结构\n   - NumPy、Pandas 库\n\n2. **数学**（不用太深，理解概念即可）：\n   - 线性代数：矩阵、向量运算\n   - 微积分：导数、梯度的概念\n   - 概率统计：均值、方差、概率分布\n\n**学习建议**：\n- 先学 Python 基础（2-4周）\n- 边学边做项目，不要只看理论\n- 从简单算法开始（线性回归、决策树）\n- 使用 Scikit-learn 库，它很友好\n\n**推荐资源**：\n- Andrew Ng 的机器学习课程（Coursera）\n- 《Python机器学习基础教程》\n- Kaggle 平台练习实战',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-11',
    role: 'user',
    content: '能给我一个简单的机器学习代码示例吗？我想看看实际是什么样的。',
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-12',
    role: 'assistant',
    content: '当然！这是一个预测房价的简单例子：\n\n```python\nfrom sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# 训练数据：房屋面积 -> 价格\nX = np.array([[50], [80], [100], [120], [150]])  # 面积(平米)\ny = np.array([150, 240, 300, 360, 450])          # 价格(万元)\n\n# 创建并训练模型\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# 预测：一个 110 平米的房子多少钱？\npredicted_price = model.predict([[110]])\nprint(f"预测价格: {predicted_price[0]:.1f}万元")\n# 输出：预测价格: 330.0万元\n```\n\n**代码解释**：\n1. 准备数据（面积和价格）\n2. 创建模型（线性回归）\n3. 训练模型（fit）\n4. 预测新数据（predict）\n\n就这么简单！这就是机器学习的基本流程。',
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-13',
    role: 'user',
    content: '深度学习和传统机器学习相比，优势在哪里？什么时候该用深度学习？',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-14',
    role: 'assistant',
    content: '很好的问题！让我对比一下：\n\n**深度学习的优势**：\n1. **自动特征提取**：不需要人工设计特征\n2. **处理复杂数据**：图像、语音、文本等非结构化数据\n3. **大数据场景**：数据越多，效果越好\n4. **端到端学习**：从原始数据直接到结果\n\n**传统 ML 的优势**：\n1. **数据需求少**：几百到几千条数据就够\n2. **训练快**：几秒到几分钟\n3. **可解释性强**：容易理解为什么这样预测\n4. **资源需求低**：普通电脑就能跑\n\n**选择建议**：\n- 表格数据（Excel那种）→ 传统 ML\n- 图像、语音、文本 → 深度学习\n- 数据少于 10000 条 → 传统 ML\n- 需要解释模型 → 传统 ML\n- 追求极致准确率 → 深度学习\n\n大部分商业问题，传统 ML 就够用了！',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-15',
    role: 'user',
    content: 'CNN、RNN、Transformer 这些都是什么？我经常看到这些缩写。',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-16',
    role: 'assistant',
    content: '这些是不同类型的神经网络架构，各有专长：\n\n**CNN (卷积神经网络)**\n- 专长：图像处理\n- 原理：像扫描仪一样逐块分析图像\n- 应用：人脸识别、医学影像、自动驾驶\n- 代表：ResNet、VGG\n\n**RNN (循环神经网络)**\n- 专长：序列数据（有时间顺序的）\n- 原理：有"记忆"，能记住之前的信息\n- 应用：语音识别、股票预测、文本生成\n- 改进版：LSTM、GRU（解决长期记忆问题）\n\n**Transformer**\n- 专长：自然语言处理（NLP）\n- 原理：注意力机制，能关注重要信息\n- 应用：ChatGPT、翻译、文本摘要\n- 代表：BERT、GPT 系列\n\n**简单记忆**：\n- 看图 → CNN\n- 看序列 → RNN\n- 看文本 → Transformer\n\nTransformer 是目前最火的，ChatGPT 就是基于它！',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-17',
    role: 'user',
    content: '训练一个深度学习模型需要什么样的硬件？我的笔记本电脑够用吗？',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-18',
    role: 'assistant',
    content: '这取决于你要做什么：\n\n**学习阶段（你现在）**：\n- 普通笔记本完全够用！\n- 可以用小数据集、小模型练习\n- 训练可能慢一点，但能学到知识\n\n**硬件建议**：\n- **CPU**：i5/i7 或同级别\n- **内存**：8GB 起步，16GB 更好\n- **GPU**：有更好（NVIDIA），没有也行\n\n**省钱方案**：\n1. **Google Colab**：免费 GPU，在线运行\n2. **Kaggle Notebooks**：免费 GPU + 数据集\n3. **云服务**：AWS、阿里云，按需付费\n\n**什么时候需要好硬件**：\n- 训练大模型（GPT 级别）\n- 处理大数据集（百万级图片）\n- 商业项目，需要快速迭代\n\n**我的建议**：\n先用 Colab 免费学习，等确定要深入再考虑买设备。很多专业人士也是用云服务，不自己买硬件。',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-19',
    role: 'user',
    content: '过拟合和欠拟合是什么意思？怎么避免？',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-20',
    role: 'assistant',
    content: '这是机器学习中最重要的概念之一！\n\n**欠拟合 (Underfitting)**\n- 问题：模型太简单，学不到规律\n- 表现：训练集和测试集都表现差\n- 比喻：学生没认真学，考试当然不好\n- 解决：用更复杂的模型、增加特征\n\n**过拟合 (Overfitting)**\n- 问题：模型太复杂，把噪音也学了\n- 表现：训练集很好，测试集很差\n- 比喻：学生死记硬背，换个题就不会\n- 解决方法：\n  1. 增加训练数据\n  2. 数据增强（图像旋转、翻转等）\n  3. Dropout（随机关闭一些神经元）\n  4. 正则化（L1、L2）\n  5. 早停（Early Stopping）\n  6. 简化模型\n\n**理想状态**：\n训练集和测试集表现都好，说明模型学到了真正的规律。\n\n**实践技巧**：\n始终保留一部分数据做测试，不参与训练，这样才能发现过拟合。',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-21',
    role: 'user',
    content: '我看到很多预训练模型，比如 BERT、GPT。我可以直接用吗？',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-22',
    role: 'assistant',
    content: '绝对可以！这叫做**迁移学习 (Transfer Learning)**，是现代 AI 的标准做法。\n\n**为什么用预训练模型**：\n1. **省时间**：别人花几周训练的，你直接用\n2. **省钱**：训练大模型要几万美元\n3. **效果好**：在海量数据上训练过\n4. **数据少也行**：你只需要少量数据微调\n\n**怎么使用**：\n```python\nfrom transformers import pipeline\n\n# 情感分析（直接用）\nclassifier = pipeline("sentiment-analysis")\nresult = classifier("这个产品太棒了！")\nprint(result)  # 正面情感\n\n# 或者微调（Fine-tuning）\nmodel = BertForSequenceClassification.from_pretrained("bert-base-chinese")\n# 用你的数据训练最后几层\n```\n\n**常用模型库**：\n- **Hugging Face**：最大的模型库，有几万个模型\n- **TensorFlow Hub**\n- **PyTorch Hub**\n\n**实践建议**：\n- 90% 的情况，用预训练模型就够了\n- 只在非常特殊的领域才需要从头训练\n- 先试试直接用，不行再微调\n\n这就像站在巨人的肩膀上！',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-23',
    role: 'user',
    content: '最后一个问题：学习 AI 的职业前景怎么样？',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ml-msg-24',
    role: 'assistant',
    content: '非常好！AI 是未来十年最重要的技术之一。\n\n**职业方向**：\n1. **机器学习工程师**：开发和部署 ML 模型\n2. **数据科学家**：分析数据，建立模型\n3. **AI 研究员**：研究新算法（需要硕士/博士）\n4. **计算机视觉工程师**：图像识别、自动驾驶\n5. **NLP 工程师**：聊天机器人、翻译系统\n6. **MLOps 工程师**：模型部署和运维\n\n**薪资水平**（中国一线城市）：\n- 初级（1-3年）：20-35万/年\n- 中级（3-5年）：35-60万/年\n- 高级（5年+）：60-100万+/年\n\n**市场需求**：\n- 各行各业都在 AI 转型\n- 人才缺口大，供不应求\n- 远程工作机会多\n\n**我的建议**：\n1. 扎实学好基础（数学、编程、算法）\n2. 多做项目，建立作品集\n3. 关注最新技术（GPT、Stable Diffusion 等）\n4. 参与开源项目\n5. 持续学习（AI 发展很快）\n\n现在开始学，正是好时机！加油！🚀',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
  },
];

// 基于对话历史生成的记忆数据
const mockMemories = [
  // 短期记忆 - 最近的对话内容
  {
    id: 'mem-stm-1',
    agentId: 'demo-agent-001',
    type: 'stm',
    content: '用户询问如何评估记忆系统的效果，讨论了检索质量、记忆利用率等指标',
    importance: 0.72,
    accessCount: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '评估指标',
      sessionId: 'session-demo-1',
      messageIds: ['msg-15', 'msg-16']
    },
    onChain: false,
  },
  {
    id: 'mem-stm-2',
    agentId: 'demo-agent-001',
    type: 'stm',
    content: '用户请求了一个最小可行的代码示例，提供了基于 LangChain 的实现',
    importance: 0.78,
    accessCount: 3,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '代码示例',
      sessionId: 'session-demo-1',
      messageIds: ['msg-13', 'msg-14'],
      hasCode: true
    },
    onChain: false,
  },
  
  // 情景记忆 - 具体的交互事件
  {
    id: 'mem-epi-1',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '2024年11月初，用户首次询问如何开发具有记忆能力的 AI Agent，表现出对该领域的强烈兴趣',
    importance: 0.95,
    accessCount: 12,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: 'AI Agent开发',
      category: 'first_contact',
      sessionId: 'session-demo-1',
      messageIds: ['msg-1', 'msg-2']
    },
    onChain: false,
  },
  {
    id: 'mem-epi-2',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户深入询问了四种记忆类型（STM、Episodic、Semantic、Reflection）的区别，显示出对理论基础的重视',
    importance: 0.88,
    accessCount: 8,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '记忆系统架构',
      category: 'deep_dive',
      sessionId: 'session-demo-1',
      messageIds: ['msg-3', 'msg-4']
    },
    onChain: false,
  },
  {
    id: 'mem-epi-3',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户询问向量数据库的作用，从理论转向技术实现细节，学习路径清晰',
    importance: 0.85,
    accessCount: 7,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '向量数据库',
      category: 'technical_detail',
      sessionId: 'session-demo-1',
      messageIds: ['msg-5', 'msg-6']
    },
    onChain: false,
  },
  {
    id: 'mem-epi-4',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户请求 RAG 的具体实现方法，并获得了包含代码的详细解释',
    importance: 0.90,
    accessCount: 10,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: 'RAG实现',
      category: 'implementation',
      sessionId: 'session-demo-1',
      messageIds: ['msg-7', 'msg-8'],
      hasCode: true
    },
    onChain: false,
  },
  {
    id: 'mem-epi-5',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户对反思机制表现出浓厚兴趣，询问如何让 Agent 能够"反思"自己的经验',
    importance: 0.92,
    accessCount: 9,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '反思机制',
      category: 'advanced_concept',
      sessionId: 'session-demo-1',
      messageIds: ['msg-9', 'msg-10']
    },
    onChain: false,
  },
  {
    id: 'mem-epi-6',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户询问现成框架，表明准备进入实践阶段，推荐了 LangChain、LlamaIndex 和 MemGPT',
    importance: 0.86,
    accessCount: 6,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '框架选择',
      category: 'tool_selection',
      sessionId: 'session-demo-1',
      messageIds: ['msg-11', 'msg-12']
    },
    onChain: false,
  },
  
  // 语义记忆 - 抽象知识
  {
    id: 'mem-sem-1',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: 'AI Agent 的记忆系统包含四种类型：短期记忆(STM)存储当前对话、情景记忆(Episodic)记录具体事件、语义记忆(Semantic)存储抽象知识、反思记忆(Reflection)包含高层次洞察',
    importance: 0.96,
    accessCount: 15,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '记忆系统',
      category: 'core_concept',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'mem-sem-2',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '向量数据库是记忆系统的核心基础设施，通过将文本转换为向量实现语义搜索，支持高效存储和关联发现',
    importance: 0.93,
    accessCount: 11,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '向量数据库',
      category: 'technical_knowledge',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'mem-sem-3',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: 'RAG (检索增强生成) 包含三个阶段：索引阶段(文档向量化)、检索阶段(相似度搜索)、生成阶段(结合上下文生成回复)。关键参数包括 chunk size、top-k 和重排序策略',
    importance: 0.94,
    accessCount: 13,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: 'RAG',
      category: 'technical_knowledge',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'mem-sem-4',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '反思机制让 Agent 能够分析过往经验并提取模式。触发条件包括定期触发、重要事件触发和主动触发。反思过程包括检索记忆、分析模式、生成洞察和更新策略',
    importance: 0.95,
    accessCount: 12,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '反思机制',
      category: 'advanced_concept',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'mem-sem-5',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: 'LangChain 是最流行的 LLM 应用框架，内置 Memory 模块和 RAG 支持；LlamaIndex 专注于数据索引和检索；MemGPT 专门为长期记忆设计，模拟操作系统的内存管理',
    importance: 0.89,
    accessCount: 9,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: 'AI框架',
      category: 'tools',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'mem-sem-6',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '记忆系统的评估维度包括：检索质量(Precision@K, Recall@K, MRR)、记忆利用率、用户体验(连贯性、个性化)和系统性能(延迟、成本)',
    importance: 0.87,
    accessCount: 7,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '评估方法',
      category: 'methodology',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  
  // 反思记忆 - 高层次洞察
  {
    id: 'mem-ref-1',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '用户展现出系统性学习的特点：从概念理解 → 技术细节 → 工具选择 → 实践应用。这种学习路径表明用户具有良好的工程背景，倾向于先建立理论基础再动手实践',
    importance: 0.97,
    accessCount: 8,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'user_profile',
      insight_type: 'learning_pattern',
      confidence: 0.92
    },
    onChain: false,
  },
  {
    id: 'mem-ref-2',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '用户对"反思机制"表现出特别的兴趣，这暗示用户不仅想构建功能性系统，更关注 Agent 的"智能"本质。应该在后续对话中提供更多关于元认知和自我改进的内容',
    importance: 0.94,
    accessCount: 6,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'user_interest',
      insight_type: 'topic_preference',
      confidence: 0.88,
      actionable: true
    },
    onChain: false,
  },
  {
    id: 'mem-ref-3',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '通过14天的交互，用户已经从"完全新手"进化到"准备实践"阶段。建议的下一步：提供项目架构指导、常见坑点提醒、以及持续的技术支持',
    importance: 0.96,
    accessCount: 5,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'progress_tracking',
      insight_type: 'learning_stage',
      confidence: 0.95,
      actionable: true
    },
    onChain: false,
  },
  
  // ========== Session 2 的记忆：AI/ML/DL 学习 ==========
  // 短期记忆
  {
    id: 'ml-mem-stm-1',
    agentId: 'demo-agent-001',
    type: 'stm',
    content: '用户询问了 AI 职业前景，讨论了职业方向、薪资水平和市场需求',
    importance: 0.70,
    accessCount: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '职业发展',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-23', 'ml-msg-24']
    },
    onChain: false,
  },
  {
    id: 'ml-mem-stm-2',
    agentId: 'demo-agent-001',
    type: 'stm',
    content: '用户了解了预训练模型和迁移学习，对 Hugging Face 表现出兴趣',
    importance: 0.76,
    accessCount: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '预训练模型',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-21', 'ml-msg-22'],
      hasCode: true
    },
    onChain: false,
  },
  
  // 情景记忆
  {
    id: 'ml-mem-epi-1',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户作为编程新手首次询问 AI 和机器学习的区别，展现出学习的热情和谦虚的态度',
    importance: 0.92,
    accessCount: 10,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: 'AI基础概念',
      category: 'first_contact',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-1', 'ml-msg-2'],
      userLevel: 'beginner'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-2',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户主动询问深度学习的概念，显示出从基础到进阶的学习意愿',
    importance: 0.88,
    accessCount: 8,
    createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '深度学习',
      category: 'concept_exploration',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-3', 'ml-msg-4']
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-3',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户对神经网络的工作原理表现出强烈好奇，使用"神奇"一词表达兴趣',
    importance: 0.90,
    accessCount: 9,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '神经网络',
      category: 'deep_interest',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-5', 'ml-msg-6'],
      emotion: 'fascinated'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-4',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户系统性地询问机器学习的三大类型，展现出结构化学习的思维方式',
    importance: 0.87,
    accessCount: 7,
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '机器学习类型',
      category: 'systematic_learning',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-7', 'ml-msg-8']
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-5',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户决定开始学习机器学习，主动询问所需基础知识，标志着从"了解"到"行动"的转变',
    importance: 0.94,
    accessCount: 11,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '学习路径',
      category: 'commitment',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-9', 'ml-msg-10'],
      milestone: true
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-6',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户请求代码示例，希望看到实际应用，体现了实践导向的学习风格',
    importance: 0.89,
    accessCount: 8,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '代码实践',
      category: 'hands_on',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-11', 'ml-msg-12'],
      hasCode: true
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-7',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户询问深度学习与传统ML的区别，显示出批判性思维和技术选型意识',
    importance: 0.91,
    accessCount: 9,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '技术对比',
      category: 'critical_thinking',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-13', 'ml-msg-14']
    },
    onChain: false,
  },
  {
    id: 'ml-mem-epi-8',
    agentId: 'demo-agent-001',
    type: 'episodic',
    content: '用户询问硬件需求，表明正在考虑实际的学习和开发环境，进入准备阶段',
    importance: 0.85,
    accessCount: 6,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '硬件配置',
      category: 'practical_preparation',
      sessionId: 'session-ml-1',
      messageIds: ['ml-msg-17', 'ml-msg-18']
    },
    onChain: false,
  },
  
  // 语义记忆
  {
    id: 'ml-mem-sem-1',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: 'AI（人工智能）是让计算机模拟人类智能的技术总称；机器学习是实现AI的方法，通过数据学习而非明确编程；深度学习是机器学习的子集，使用多层神经网络。层级关系：AI > 机器学习 > 深度学习',
    importance: 0.97,
    accessCount: 15,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: 'AI基础概念',
      category: 'core_knowledge',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-2',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '神经网络模仿人脑结构，包含输入层、多个隐藏层和输出层。每层学习不同层次的特征：从简单的边缘线条到复杂的语义概念。通过反复训练和参数调整来提高准确率',
    importance: 0.95,
    accessCount: 13,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '神经网络',
      category: 'technical_knowledge',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-3',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '机器学习三大类型：1)监督学习-有标准答案，用于分类和回归；2)无监督学习-自己发现规律，用于聚类和降维；3)强化学习-通过奖惩学习，用于游戏AI和机器人控制。监督学习占80%应用',
    importance: 0.94,
    accessCount: 12,
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '机器学习类型',
      category: 'classification',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-4',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '学习机器学习需要：1)Python编程基础和NumPy/Pandas库；2)基础数学（线性代数、微积分、概率统计）；3)从简单算法开始；4)使用Scikit-learn库。推荐Andrew Ng课程和Kaggle实战',
    importance: 0.93,
    accessCount: 14,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '学习路径',
      category: 'methodology',
      source: 'conversation_extraction',
      actionable: true
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-5',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '深度学习优势：自动特征提取、处理复杂非结构化数据、大数据场景效果好。传统ML优势：数据需求少、训练快、可解释性强、资源需求低。选择原则：表格数据用传统ML，图像/语音/文本用深度学习',
    importance: 0.92,
    accessCount: 11,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '技术选型',
      category: 'decision_framework',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-6',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '神经网络架构：CNN专长图像处理（ResNet/VGG）、RNN专长序列数据（LSTM/GRU）、Transformer专长NLP（BERT/GPT）。简记：看图用CNN、看序列用RNN、看文本用Transformer',
    importance: 0.96,
    accessCount: 13,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '神经网络架构',
      category: 'technical_knowledge',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-7',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '过拟合：模型太复杂，训练集好但测试集差。解决方法：增加数据、数据增强、Dropout、正则化、早停、简化模型。欠拟合：模型太简单，训练和测试都差。解决：用更复杂模型、增加特征',
    importance: 0.94,
    accessCount: 10,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '模型优化',
      category: 'problem_solving',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-sem-8',
    agentId: 'demo-agent-001',
    type: 'semantic',
    content: '迁移学习：使用预训练模型（BERT/GPT等）可以省时省钱、效果好、数据需求少。Hugging Face是最大的模型库。90%情况用预训练模型就够，只在特殊领域才需要从头训练',
    importance: 0.91,
    accessCount: 9,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      topic: '迁移学习',
      category: 'best_practice',
      source: 'conversation_extraction'
    },
    onChain: false,
  },
  
  // 反思记忆
  {
    id: 'ml-mem-ref-1',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '用户展现出优秀的学习特质：从基础概念开始、循序渐进、主动提问、注重实践。20天内从"什么是AI"进步到了解预训练模型和职业规划，学习速度快且路径清晰',
    importance: 0.96,
    accessCount: 8,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'user_profile',
      insight_type: 'learning_pattern',
      confidence: 0.94
    },
    onChain: false,
  },
  {
    id: 'ml-mem-ref-2',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '用户对神经网络和深度学习表现出特别的兴趣（使用"神奇"等情感词汇），但同时保持理性，会询问实际应用场景和技术选型。建议后续提供更多深度学习的实战项目',
    importance: 0.93,
    accessCount: 7,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'user_interest',
      insight_type: 'topic_preference',
      confidence: 0.90,
      actionable: true
    },
    onChain: false,
  },
  {
    id: 'ml-mem-ref-3',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '用户已经从"探索阶段"进入"准备实践阶段"：询问了学习路径、代码示例、硬件需求、预训练模型使用。下一步应该引导用户开始第一个实战项目，推荐从Kaggle入门竞赛开始',
    importance: 0.95,
    accessCount: 6,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'progress_tracking',
      insight_type: 'learning_stage',
      confidence: 0.92,
      actionable: true,
      nextStep: 'guide_first_project'
    },
    onChain: false,
  },
  {
    id: 'ml-mem-ref-4',
    agentId: 'demo-agent-001',
    type: 'reflection',
    content: '用户询问职业前景表明其学习动机明确：不仅是兴趣驱动，也有职业发展考虑。这种目标导向的学习者通常更有毅力。应该在后续对话中分享更多行业案例和职业发展建议',
    importance: 0.90,
    accessCount: 5,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastAccessedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { 
      category: 'motivation_analysis',
      insight_type: 'career_oriented',
      confidence: 0.88,
      actionable: true
    },
    onChain: false,
  },
];

const mockEntities = [
  {
    id: 'ent-user',
    name: '用户',
    type: 'entity',
    properties: { 
      role: 'developer',
      learningStage: 'intermediate',
      interests: ['AI', 'memory_systems', 'agent_development']
    },
    memoryIds: ['mem-epi-1', 'mem-epi-2', 'mem-ref-1', 'mem-ref-2', 'mem-ref-3'],
    importance: 0.98,
  },
  {
    id: 'ent-memory-system',
    name: '记忆系统',
    type: 'concept',
    properties: { 
      category: 'AI_architecture',
      complexity: 'high',
      components: ['STM', 'Episodic', 'Semantic', 'Reflection']
    },
    memoryIds: ['mem-epi-1', 'mem-epi-2', 'mem-sem-1'],
    importance: 0.96,
  },
  {
    id: 'ent-rag',
    name: 'RAG',
    type: 'concept',
    properties: { 
      category: 'technique',
      fullName: 'Retrieval-Augmented Generation',
      difficulty: 'medium'
    },
    memoryIds: ['mem-epi-4', 'mem-sem-3'],
    importance: 0.94,
  },
  {
    id: 'ent-vector-db',
    name: '向量数据库',
    type: 'concept',
    properties: { 
      category: 'infrastructure',
      purpose: 'semantic_search',
      examples: ['Pinecone', 'Weaviate', 'Chroma']
    },
    memoryIds: ['mem-epi-3', 'mem-sem-2'],
    importance: 0.92,
  },
  {
    id: 'ent-reflection',
    name: '反思机制',
    type: 'concept',
    properties: { 
      category: 'AI_capability',
      level: 'advanced',
      purpose: 'meta_cognition'
    },
    memoryIds: ['mem-epi-5', 'mem-sem-4', 'mem-ref-2'],
    importance: 0.95,
  },
  {
    id: 'ent-langchain',
    name: 'LangChain',
    type: 'concept',
    properties: { 
      category: 'framework',
      language: 'Python',
      popularity: 'high'
    },
    memoryIds: ['mem-epi-6', 'mem-sem-5', 'mem-stm-2'],
    importance: 0.89,
  },
  {
    id: 'ent-episodic-memory',
    name: '情景记忆',
    type: 'concept',
    properties: { 
      category: 'memory_type',
      characteristics: 'event_based',
      temporal: true
    },
    memoryIds: ['mem-epi-2', 'mem-sem-1'],
    importance: 0.88,
  },
  {
    id: 'ent-semantic-memory',
    name: '语义记忆',
    type: 'concept',
    properties: { 
      category: 'memory_type',
      characteristics: 'knowledge_based',
      temporal: false
    },
    memoryIds: ['mem-epi-2', 'mem-sem-1'],
    importance: 0.87,
  },
  {
    id: 'ent-evaluation',
    name: '评估方法',
    type: 'concept',
    properties: { 
      category: 'methodology',
      metrics: ['Precision', 'Recall', 'MRR'],
      importance: 'critical'
    },
    memoryIds: ['mem-stm-1', 'mem-sem-6'],
    importance: 0.85,
  },
  {
    id: 'ent-ai-agent',
    name: 'AI Agent',
    type: 'concept',
    properties: { 
      category: 'AI_system',
      capabilities: ['memory', 'reasoning', 'action'],
      complexity: 'high'
    },
    memoryIds: ['mem-epi-1', 'mem-ref-1'],
    importance: 0.97,
  },
  
  // ========== Session 2 的实体：AI/ML/DL 学习 ==========
  {
    id: 'ml-ent-learner',
    name: '学习者',
    type: 'entity',
    properties: { 
      role: 'beginner',
      learningStage: 'ready_to_practice',
      interests: ['deep_learning', 'neural_networks', 'career'],
      motivation: 'career_and_interest'
    },
    memoryIds: ['ml-mem-epi-1', 'ml-mem-epi-5', 'ml-mem-ref-1', 'ml-mem-ref-4'],
    importance: 0.97,
  },
  {
    id: 'ml-ent-ai',
    name: '人工智能',
    type: 'concept',
    properties: { 
      category: 'field',
      scope: 'broad',
      definition: '让计算机模拟人类智能'
    },
    memoryIds: ['ml-mem-epi-1', 'ml-mem-sem-1'],
    importance: 0.95,
  },
  {
    id: 'ml-ent-ml',
    name: '机器学习',
    type: 'concept',
    properties: { 
      category: 'methodology',
      approach: 'data_driven',
      usage: '80%_of_ai_applications'
    },
    memoryIds: ['ml-mem-epi-1', 'ml-mem-epi-4', 'ml-mem-sem-1', 'ml-mem-sem-3'],
    importance: 0.96,
  },
  {
    id: 'ml-ent-dl',
    name: '深度学习',
    type: 'concept',
    properties: { 
      category: 'methodology',
      approach: 'neural_networks',
      complexity: 'high',
      dataRequirement: 'large'
    },
    memoryIds: ['ml-mem-epi-2', 'ml-mem-sem-1', 'ml-mem-sem-5', 'ml-mem-ref-2'],
    importance: 0.94,
  },
  {
    id: 'ml-ent-nn',
    name: '神经网络',
    type: 'concept',
    properties: { 
      category: 'architecture',
      inspiration: 'human_brain',
      structure: 'layered'
    },
    memoryIds: ['ml-mem-epi-3', 'ml-mem-sem-2', 'ml-mem-sem-6'],
    importance: 0.93,
  },
  {
    id: 'ml-ent-cnn',
    name: 'CNN',
    type: 'concept',
    properties: { 
      category: 'architecture',
      fullName: 'Convolutional Neural Network',
      specialty: 'image_processing'
    },
    memoryIds: ['ml-mem-sem-6'],
    importance: 0.88,
  },
  {
    id: 'ml-ent-rnn',
    name: 'RNN',
    type: 'concept',
    properties: { 
      category: 'architecture',
      fullName: 'Recurrent Neural Network',
      specialty: 'sequence_data'
    },
    memoryIds: ['ml-mem-sem-6'],
    importance: 0.87,
  },
  {
    id: 'ml-ent-transformer',
    name: 'Transformer',
    type: 'concept',
    properties: { 
      category: 'architecture',
      specialty: 'NLP',
      examples: ['BERT', 'GPT', 'ChatGPT']
    },
    memoryIds: ['ml-mem-sem-6'],
    importance: 0.92,
  },
  {
    id: 'ml-ent-supervised',
    name: '监督学习',
    type: 'concept',
    properties: { 
      category: 'learning_type',
      hasLabels: true,
      usage: '80%_of_ml'
    },
    memoryIds: ['ml-mem-epi-4', 'ml-mem-sem-3'],
    importance: 0.90,
  },
  {
    id: 'ml-ent-transfer',
    name: '迁移学习',
    type: 'concept',
    properties: { 
      category: 'technique',
      benefit: 'save_time_and_money',
      platform: 'Hugging Face'
    },
    memoryIds: ['ml-mem-stm-2', 'ml-mem-sem-8'],
    importance: 0.89,
  },
  {
    id: 'ml-ent-python',
    name: 'Python',
    type: 'concept',
    properties: { 
      category: 'programming_language',
      role: 'primary_ml_language',
      libraries: ['NumPy', 'Pandas', 'Scikit-learn']
    },
    memoryIds: ['ml-mem-epi-5', 'ml-mem-sem-4'],
    importance: 0.91,
  },
  {
    id: 'ml-ent-overfitting',
    name: '过拟合',
    type: 'concept',
    properties: { 
      category: 'problem',
      symptom: 'good_train_bad_test',
      solutions: ['more_data', 'dropout', 'regularization']
    },
    memoryIds: ['ml-mem-sem-7'],
    importance: 0.86,
  },
];

const mockRelationships = [
  // 用户与概念的关系
  {
    id: 'rel-1',
    sourceId: 'ent-user',
    targetId: 'ent-ai-agent',
    type: 'learning',
    weight: 0.95,
    properties: { 
      description: '用户正在学习 AI Agent 开发',
      strength: 'strong',
      duration: '14_days'
    },
  },
  {
    id: 'rel-2',
    sourceId: 'ent-user',
    targetId: 'ent-memory-system',
    type: 'interested_in',
    weight: 0.92,
    properties: { 
      description: '用户对记忆系统架构特别感兴趣',
      strength: 'strong'
    },
  },
  {
    id: 'rel-3',
    sourceId: 'ent-user',
    targetId: 'ent-reflection',
    type: 'fascinated_by',
    weight: 0.90,
    properties: { 
      description: '用户对反思机制表现出浓厚兴趣',
      strength: 'very_strong'
    },
  },
  {
    id: 'rel-4',
    sourceId: 'ent-user',
    targetId: 'ent-langchain',
    type: 'will_use',
    weight: 0.85,
    properties: { 
      description: '用户计划使用 LangChain 进行开发',
      stage: 'planning'
    },
  },
  
  // AI Agent 与其组件的关系
  {
    id: 'rel-5',
    sourceId: 'ent-memory-system',
    targetId: 'ent-ai-agent',
    type: 'component_of',
    weight: 0.96,
    properties: { 
      description: '记忆系统是 AI Agent 的核心组件',
      importance: 'critical'
    },
  },
  {
    id: 'rel-6',
    sourceId: 'ent-reflection',
    targetId: 'ent-memory-system',
    type: 'part_of',
    weight: 0.93,
    properties: { 
      description: '反思机制是记忆系统的高级功能',
      level: 'advanced'
    },
  },
  {
    id: 'rel-7',
    sourceId: 'ent-episodic-memory',
    targetId: 'ent-memory-system',
    type: 'type_of',
    weight: 0.88,
    properties: { 
      description: '情景记忆是记忆系统的一种类型'
    },
  },
  {
    id: 'rel-8',
    sourceId: 'ent-semantic-memory',
    targetId: 'ent-memory-system',
    type: 'type_of',
    weight: 0.87,
    properties: { 
      description: '语义记忆是记忆系统的一种类型'
    },
  },
  
  // 技术依赖关系
  {
    id: 'rel-9',
    sourceId: 'ent-rag',
    targetId: 'ent-vector-db',
    type: 'depends_on',
    weight: 0.94,
    properties: { 
      description: 'RAG 依赖向量数据库实现语义检索',
      dependency: 'strong'
    },
  },
  {
    id: 'rel-10',
    sourceId: 'ent-memory-system',
    targetId: 'ent-vector-db',
    type: 'uses',
    weight: 0.91,
    properties: { 
      description: '记忆系统使用向量数据库存储和检索',
      purpose: 'storage_and_retrieval'
    },
  },
  {
    id: 'rel-11',
    sourceId: 'ent-rag',
    targetId: 'ent-memory-system',
    type: 'enables',
    weight: 0.89,
    properties: { 
      description: 'RAG 技术使记忆检索成为可能',
      role: 'enabler'
    },
  },
  
  // 框架与技术的关系
  {
    id: 'rel-12',
    sourceId: 'ent-langchain',
    targetId: 'ent-memory-system',
    type: 'implements',
    weight: 0.86,
    properties: { 
      description: 'LangChain 提供记忆系统的实现',
      maturity: 'production_ready'
    },
  },
  {
    id: 'rel-13',
    sourceId: 'ent-langchain',
    targetId: 'ent-rag',
    type: 'supports',
    weight: 0.88,
    properties: { 
      description: 'LangChain 内置 RAG 支持',
      integration: 'native'
    },
  },
  
  // 评估相关
  {
    id: 'rel-14',
    sourceId: 'ent-evaluation',
    targetId: 'ent-memory-system',
    type: 'evaluates',
    weight: 0.84,
    properties: { 
      description: '评估方法用于衡量记忆系统效果',
      purpose: 'quality_assurance'
    },
  },
  {
    id: 'rel-15',
    sourceId: 'ent-evaluation',
    targetId: 'ent-rag',
    type: 'measures',
    weight: 0.82,
    properties: { 
      description: '评估指标衡量 RAG 检索质量',
      metrics: ['precision', 'recall']
    },
  },
  
  // ========== Session 2 的关系：AI/ML/DL 学习 ==========
  // 学习者与知识的关系
  {
    id: 'ml-rel-1',
    sourceId: 'ml-ent-learner',
    targetId: 'ml-ent-ai',
    type: 'learning',
    weight: 0.94,
    properties: { 
      description: '学习者正在学习人工智能',
      stage: 'foundation',
      duration: '20_days'
    },
  },
  {
    id: 'ml-rel-2',
    sourceId: 'ml-ent-learner',
    targetId: 'ml-ent-dl',
    type: 'fascinated_by',
    weight: 0.92,
    properties: { 
      description: '学习者对深度学习特别感兴趣',
      emotion: 'fascinated',
      priority: 'high'
    },
  },
  {
    id: 'ml-rel-3',
    sourceId: 'ml-ent-learner',
    targetId: 'ml-ent-nn',
    type: 'curious_about',
    weight: 0.90,
    properties: { 
      description: '学习者对神经网络工作原理很好奇',
      emotion: 'curious'
    },
  },
  {
    id: 'ml-rel-4',
    sourceId: 'ml-ent-learner',
    targetId: 'ml-ent-python',
    type: 'will_learn',
    weight: 0.88,
    properties: { 
      description: '学习者计划学习Python作为基础',
      stage: 'planning'
    },
  },
  
  // 概念层级关系
  {
    id: 'ml-rel-5',
    sourceId: 'ml-ent-ml',
    targetId: 'ml-ent-ai',
    type: 'subset_of',
    weight: 0.96,
    properties: { 
      description: '机器学习是人工智能的子集',
      relationship: 'part_whole'
    },
  },
  {
    id: 'ml-rel-6',
    sourceId: 'ml-ent-dl',
    targetId: 'ml-ent-ml',
    type: 'subset_of',
    weight: 0.95,
    properties: { 
      description: '深度学习是机器学习的子集',
      relationship: 'part_whole'
    },
  },
  {
    id: 'ml-rel-7',
    sourceId: 'ml-ent-nn',
    targetId: 'ml-ent-dl',
    type: 'foundation_of',
    weight: 0.94,
    properties: { 
      description: '神经网络是深度学习的基础',
      role: 'core_component'
    },
  },
  
  // 神经网络架构关系
  {
    id: 'ml-rel-8',
    sourceId: 'ml-ent-cnn',
    targetId: 'ml-ent-nn',
    type: 'type_of',
    weight: 0.90,
    properties: { 
      description: 'CNN是神经网络的一种类型',
      specialty: 'image'
    },
  },
  {
    id: 'ml-rel-9',
    sourceId: 'ml-ent-rnn',
    targetId: 'ml-ent-nn',
    type: 'type_of',
    weight: 0.89,
    properties: { 
      description: 'RNN是神经网络的一种类型',
      specialty: 'sequence'
    },
  },
  {
    id: 'ml-rel-10',
    sourceId: 'ml-ent-transformer',
    targetId: 'ml-ent-nn',
    type: 'type_of',
    weight: 0.93,
    properties: { 
      description: 'Transformer是神经网络的一种类型',
      specialty: 'NLP',
      popularity: 'highest'
    },
  },
  
  // 学习类型关系
  {
    id: 'ml-rel-11',
    sourceId: 'ml-ent-supervised',
    targetId: 'ml-ent-ml',
    type: 'method_of',
    weight: 0.91,
    properties: { 
      description: '监督学习是机器学习的主要方法',
      usage: '80%'
    },
  },
  
  // 技术与工具关系
  {
    id: 'ml-rel-12',
    sourceId: 'ml-ent-python',
    targetId: 'ml-ent-ml',
    type: 'used_for',
    weight: 0.92,
    properties: { 
      description: 'Python是机器学习的主要编程语言',
      role: 'primary_language'
    },
  },
  {
    id: 'ml-rel-13',
    sourceId: 'ml-ent-transfer',
    targetId: 'ml-ent-dl',
    type: 'technique_for',
    weight: 0.87,
    properties: { 
      description: '迁移学习是深度学习的重要技术',
      benefit: 'efficiency'
    },
  },
  {
    id: 'ml-rel-14',
    sourceId: 'ml-ent-transfer',
    targetId: 'ml-ent-transformer',
    type: 'commonly_uses',
    weight: 0.90,
    properties: { 
      description: '迁移学习常用Transformer模型',
      examples: ['BERT', 'GPT']
    },
  },
  
  // 问题与解决方案关系
  {
    id: 'ml-rel-15',
    sourceId: 'ml-ent-overfitting',
    targetId: 'ml-ent-ml',
    type: 'challenge_in',
    weight: 0.85,
    properties: { 
      description: '过拟合是机器学习中的常见挑战',
      severity: 'common'
    },
  },
];

// 初始化一个预设的 demo session
const demoSession = {
  id: 'session-demo-1',
  agentId: 'demo-agent-001',
  userId: 'demo-user',
  name: 'AI Agent 记忆系统学习之旅',
  createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  lastMessageAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  messageCount: mockConversationHistory.length,
  config: {
    agentType: 'memory_expert',
    ragMode: 'agentic',
    memoryTypes: ['stm', 'episodic', 'semantic', 'reflection'],
    autoReflection: true,
    blockchainEnabled: false,
  },
};
sessions.push(demoSession);
messages['session-demo-1'] = mockConversationHistory;

// 初始化第二个预设 session - AI/ML/DL 学习
const mlSession = {
  id: 'session-ml-1',
  agentId: 'demo-agent-001',
  userId: 'demo-user',
  name: 'AI/机器学习/深度学习入门之旅',
  createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  lastMessageAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  messageCount: mlConversationHistory.length,
  config: {
    agentType: 'ai_tutor',
    ragMode: 'standard',
    memoryTypes: ['stm', 'episodic', 'semantic', 'reflection'],
    autoReflection: true,
    blockchainEnabled: false,
  },
};
sessions.push(mlSession);
messages['session-ml-1'] = mlConversationHistory;

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

// 简单的相似度计算函数（基于关键词匹配）
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
  return commonWords.length / Math.max(words1.length, words2.length);
}

// 检索相关记忆
function retrieveRelevantMemories(query, sessionId, topK = 3) {
  // 检索所有记忆（不限制 session，这样新 session 也能访问历史知识）
  // 但优先返回当前 session 的记忆
  const allMemories = mockMemories.map(mem => ({
    memory: mem,
    score: calculateSimilarity(query, mem.content),
    isCurrentSession: mem.metadata.sessionId === sessionId
  })).filter(item => item.score > 0.05) // 降低阈值，让更多记忆被检索到
    .sort((a, b) => {
      // 先按是否当前 session 排序，再按相似度排序
      if (a.isCurrentSession && !b.isCurrentSession) return -1;
      if (!a.isCurrentSession && b.isCurrentSession) return 1;
      return b.score - a.score;
    })
    .slice(0, topK);
  
  return allMemories;
}

app.post('/v1/agents/:agentId/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  
  console.log('📨 Received message:', { sessionId, message });
  
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
  
  console.log('✅ User message saved:', userMessage.id);
  console.log('📊 Total messages in session:', messages[sessionId].length);
  
  // 🔍 检索相关记忆
  const relevantMemories = retrieveRelevantMemories(message, sessionId, 5);
  console.log('🧠 Retrieved memories:', relevantMemories.length);
  
  if (relevantMemories.length > 0) {
    console.log('📚 Top memories:');
    relevantMemories.forEach((item, idx) => {
      const mem = item.memory;
      const timeAgo = Math.floor((Date.now() - new Date(mem.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  ${idx + 1}. [${mem.type.toUpperCase()}] (${timeAgo}天前, 相似度:${item.score.toFixed(2)}, 重要性:${mem.importance.toFixed(2)})`);
      console.log(`     ${mem.content.substring(0, 100)}...`);
    });
  } else {
    console.log('⚠️ No relevant memories found for this message');
  }
  
  // Get AI response (real or mock)
  let aiResponse = '';
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
    console.log('🤖 Calling OpenAI API with memory context...');
    try {
      // 构建包含记忆的系统提示
      let systemPrompt = '你是一个具有记忆能力的AI助手。';
      
      if (relevantMemories.length > 0) {
        systemPrompt += '\n\n📚 相关记忆：\n';
        relevantMemories.forEach((item, idx) => {
          const mem = item.memory;
          const timeAgo = Math.floor((Date.now() - new Date(mem.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          systemPrompt += `\n${idx + 1}. [${mem.type.toUpperCase()}] (${timeAgo}天前, 重要性:${mem.importance.toFixed(2)})\n   ${mem.content}\n`;
        });
        systemPrompt += '\n请基于这些记忆来回答用户的问题。在回答开始时，简要说明你参考了哪些记忆（例如："根据我们X天前讨论的..."）。';
      }
      
      // Build conversation history
      const conversationHistory = [
        { role: 'system', content: systemPrompt },
        ...messages[sessionId].slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
      
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: conversationHistory,
          temperature: 0.7,
          max_tokens: 1500,
          stream: false, // 先不用流式，确保基本功能正常
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      aiResponse = openaiResponse.data.choices[0].message.content;
      console.log('✅ OpenAI response received');
    } catch (error) {
      console.error('❌ OpenAI API error:', error.response?.data || error.message);
      aiResponse = `抱歉，AI服务暂时不可用。错误: ${error.message}`;
    }
  } else {
    console.log('⚠️ No OpenAI API key found, using mock response');
    
    // Mock response with memory context
    if (relevantMemories.length > 0) {
      const mem = relevantMemories[0].memory;
      const timeAgo = Math.floor((Date.now() - new Date(mem.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      aiResponse = `根据我们${timeAgo}天前的对话记忆，我记得：\n\n"${mem.content}"\n\n基于这个记忆，我来回答你的问题："${message}"\n\n[这是一个模拟回复。请配置 OPENAI_API_KEY 以获得真实的AI回复]`;
    } else {
      aiResponse = `This is a mock response to: "${message}". Please configure OPENAI_API_KEY in .env.local for real AI responses.`;
    }
  }
  
  // Create AI message
  const aiMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString(),
  };
  messages[sessionId].push(aiMessage);
  
  console.log('🤖 AI message created');
  
  // 🌊 流式发送消息（模拟打字效果）
  console.log('🌊 Starting stream for session:', sessionId);
  console.log('📝 Message length:', aiResponse.length, 'chars');
  
  // 等待一下，确保前端已经加入 room
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const words = aiResponse.split('');
  let currentText = '';
  
  // 立即发送一个空消息，让前端知道开始了
  console.log('📤 Emitting message:start to room:', sessionId);
  io.to(sessionId).emit('message:start', { 
    id: aiMessage.id,
    sessionId: sessionId 
  });
  
  // 等待一下让前端处理 start 事件
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 逐字发送
  for (let i = 0; i < words.length; i++) {
    currentText += words[i];
    
    // 每5个字符发送一次更新
    if (i % 5 === 0 || i === words.length - 1) {
      const chunkData = {
        id: aiMessage.id,
        content: currentText,
        done: i === words.length - 1,
        sessionId: sessionId
      };
      
      if (i % 50 === 0) {
        console.log(`📤 Emitting chunk ${i}/${words.length} (${currentText.length} chars)`);
      }
      
      io.to(sessionId).emit('message:chunk', chunkData);
      
      // 延迟，让效果更明显
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
  
  // 发送完成消息
  console.log('📤 Emitting final message to room:', sessionId);
  io.to(sessionId).emit('message', {
    ...aiMessage,
    ragResults: relevantMemories.map(item => ({
      memoryId: item.memory.id,
      type: item.memory.type,
      content: item.memory.content.substring(0, 200),
      score: item.score,
      importance: item.memory.importance
    }))
  });
  console.log('✅ Stream completed for session:', sessionId);
  
  const response = {
    data: {
      messageId: userMessage.id,
      response: aiResponse,
      memoriesCreated: [],
      ragResults: [],
    },
    success: true,
  };
  
  console.log('📤 Sending response');
  res.json(response);
});

// Memories API
app.get('/v1/agents/:agentId/memories', (req, res) => {
  res.json({
    data: mockMemories,
    total: mockMemories.length,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
});

// Visualization API
app.get('/v1/agents/:agentId/visualization/data', (req, res) => {
  res.json({
    data: {
      memories: mockMemories,
      entities: mockEntities,
      relationships: mockRelationships,
    },
    success: true,
  });
});

app.get('/v1/agents/:agentId/visualization/timeline', (req, res) => {
  const timelineData = mockMemories.map(mem => ({
    id: mem.id,
    type: mem.type,
    content: mem.content,
    timestamp: mem.timestamp,
    importance: mem.importance,
  })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  res.json({ data: timelineData, success: true });
});

app.get('/v1/agents/:agentId/visualization/graph', (req, res) => {
  const nodes = mockEntities.map(ent => ({
    id: ent.id,
    label: ent.name,
    type: ent.type,
    size: ent.count * 10,
  }));
  
  const edges = mockRelationships.map((rel, idx) => ({
    id: `edge-${idx}`,
    source: rel.source,
    target: rel.target,
    label: rel.type,
    strength: rel.strength,
  }));
  
  res.json({ data: { nodes, edges }, success: true });
});

app.get('/v1/agents/:agentId/visualization/statistics', (req, res) => {
  const byType = mockMemories.reduce((acc, mem) => {
    acc[mem.type] = (acc[mem.type] || 0) + 1;
    return acc;
  }, {});
  
  const importanceRanges = [
    { range: '0.9-1.0', count: mockMemories.filter(m => m.importance >= 0.9).length },
    { range: '0.8-0.9', count: mockMemories.filter(m => m.importance >= 0.8 && m.importance < 0.9).length },
    { range: '0.7-0.8', count: mockMemories.filter(m => m.importance >= 0.7 && m.importance < 0.8).length },
    { range: '0.6-0.7', count: mockMemories.filter(m => m.importance >= 0.6 && m.importance < 0.7).length },
  ];
  
  const topMemories = [...mockMemories]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map(m => ({
      id: m.id,
      content: m.content,
      importance: m.importance,
      type: m.type,
    }));
  
  const topEntities = [...mockEntities]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Generate trend data for the last 7 days
  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = mockMemories.filter(m => {
      const memDate = new Date(m.timestamp).toISOString().split('T')[0];
      return memDate === dateStr;
    }).length;
    trendData.push({ date: dateStr, count });
  }
  
  res.json({
    data: {
      memoryStats: {
        total: mockMemories.length,
        byType,
        byImportance: importanceRanges,
      },
      trendData,
      topMemories,
      topEntities,
    },
    success: true,
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
  
  // 加入 session room（用于流式消息）
  socket.on('join-session', (sessionId) => {
    console.log('Session joined:', sessionId);
    socket.join(sessionId);
    socket.emit('session-joined', { sessionId });
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
