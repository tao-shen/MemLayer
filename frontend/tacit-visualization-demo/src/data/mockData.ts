// 模拟记忆数据

export interface Memory {
  id: string;
  type: 'stm' | 'episodic' | 'semantic' | 'reflection';
  content: string;
  timestamp: Date;
  importance: number;
  metadata?: any;
  // Type-specific fields
  sessionId?: string;
  eventType?: string;
  accessCount?: number;
  source?: string;
  category?: string;
  verified?: boolean;
  insights?: string[];
  sourceMemoryIds?: string[];
}

// 生成模拟数据
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const mockMemories: Memory[] = [
  // STM (短期记忆) - 最近的会话信息
  {
    id: 'stm-1',
    type: 'stm',
    content: '用户询问了关于机器学习的基础概念',
    timestamp: daysAgo(0),
    importance: 5,
    sessionId: 'session-001',
  },
  {
    id: 'stm-2',
    type: 'stm',
    content: '用户表示对深度学习特别感兴趣',
    timestamp: daysAgo(0),
    importance: 6,
    sessionId: 'session-001',
  },
  {
    id: 'stm-3',
    type: 'stm',
    content: '讨论了神经网络的反向传播算法',
    timestamp: daysAgo(0),
    importance: 7,
    sessionId: 'session-001',
  },
  {
    id: 'stm-4',
    type: 'stm',
    content: '用户提到正在学习 PyTorch 框架',
    timestamp: daysAgo(0),
    importance: 6,
    sessionId: 'session-001',
  },

  // Episodic (情景记忆) - 具体事件
  {
    id: 'epi-1',
    type: 'episodic',
    content: '用户首次访问平台，创建了账户',
    timestamp: daysAgo(30),
    importance: 8,
    eventType: 'interaction',
    accessCount: 5,
  },
  {
    id: 'epi-2',
    type: 'episodic',
    content: '用户完成了第一个机器学习项目：手写数字识别',
    timestamp: daysAgo(25),
    importance: 9,
    eventType: 'outcome',
    accessCount: 12,
  },
  {
    id: 'epi-3',
    type: 'episodic',
    content: '用户在项目中遇到过拟合问题，寻求帮助',
    timestamp: daysAgo(20),
    importance: 7,
    eventType: 'interaction',
    accessCount: 8,
  },
  {
    id: 'epi-4',
    type: 'episodic',
    content: '用户成功应用了 Dropout 和数据增强解决过拟合',
    timestamp: daysAgo(18),
    importance: 8,
    eventType: 'decision',
    accessCount: 10,
  },
  {
    id: 'epi-5',
    type: 'episodic',
    content: '用户开始学习卷积神经网络（CNN）',
    timestamp: daysAgo(15),
    importance: 7,
    eventType: 'observation',
    accessCount: 6,
  },
  {
    id: 'epi-6',
    type: 'episodic',
    content: '用户实现了图像分类项目，准确率达到 95%',
    timestamp: daysAgo(10),
    importance: 9,
    eventType: 'outcome',
    accessCount: 15,
  },
  {
    id: 'epi-7',
    type: 'episodic',
    content: '用户询问了关于迁移学习的最佳实践',
    timestamp: daysAgo(5),
    importance: 7,
    eventType: 'interaction',
    accessCount: 4,
  },
  {
    id: 'epi-8',
    type: 'episodic',
    content: '用户使用预训练的 ResNet 模型进行迁移学习',
    timestamp: daysAgo(3),
    importance: 8,
    eventType: 'decision',
    accessCount: 7,
  },

  // Semantic (语义记忆) - 知识和概念
  {
    id: 'sem-1',
    type: 'semantic',
    content: '机器学习是人工智能的一个分支，使计算机能够从数据中学习',
    timestamp: daysAgo(28),
    importance: 8,
    source: 'Wikipedia',
    category: '基础概念',
    verified: true,
  },
  {
    id: 'sem-2',
    type: 'semantic',
    content: '深度学习使用多层神经网络来学习数据的层次化表示',
    timestamp: daysAgo(26),
    importance: 9,
    source: 'Deep Learning Book',
    category: '深度学习',
    verified: true,
  },
  {
    id: 'sem-3',
    type: 'semantic',
    content: '反向传播是训练神经网络的核心算法，通过链式法则计算梯度',
    timestamp: daysAgo(24),
    importance: 9,
    source: 'Neural Networks Course',
    category: '算法',
    verified: true,
  },
  {
    id: 'sem-4',
    type: 'semantic',
    content: '过拟合是指模型在训练数据上表现很好，但在新数据上表现差',
    timestamp: daysAgo(22),
    importance: 8,
    source: 'ML Textbook',
    category: '问题诊断',
    verified: true,
  },
  {
    id: 'sem-5',
    type: 'semantic',
    content: 'Dropout 是一种正则化技术，随机丢弃神经元以防止过拟合',
    timestamp: daysAgo(19),
    importance: 8,
    source: 'Research Paper',
    category: '正则化',
    verified: true,
  },
  {
    id: 'sem-6',
    type: 'semantic',
    content: 'CNN 特别适合处理图像数据，通过卷积层提取空间特征',
    timestamp: daysAgo(16),
    importance: 9,
    source: 'Computer Vision Course',
    category: '深度学习',
    verified: true,
  },
  {
    id: 'sem-7',
    type: 'semantic',
    content: '迁移学习利用预训练模型的知识来解决新任务',
    timestamp: daysAgo(12),
    importance: 8,
    source: 'Transfer Learning Tutorial',
    category: '高级技术',
    verified: true,
  },
  {
    id: 'sem-8',
    type: 'semantic',
    content: 'ResNet 使用残差连接解决了深层网络的梯度消失问题',
    timestamp: daysAgo(8),
    importance: 9,
    source: 'ResNet Paper',
    category: '网络架构',
    verified: true,
  },
  {
    id: 'sem-9',
    type: 'semantic',
    content: 'PyTorch 是一个流行的深度学习框架，提供动态计算图',
    timestamp: daysAgo(6),
    importance: 7,
    source: 'PyTorch Documentation',
    category: '工具框架',
    verified: true,
  },

  // Reflection (反思记忆) - 从其他记忆中提取的洞察
  {
    id: 'ref-1',
    type: 'reflection',
    content: '用户的学习路径：从基础概念 → 实践项目 → 遇到问题 → 学习解决方案 → 应用高级技术',
    timestamp: daysAgo(14),
    importance: 10,
    insights: [
      '用户采用实践驱动的学习方式',
      '遇到问题时积极寻求解决方案',
      '学习进度稳定且持续',
    ],
    sourceMemoryIds: ['epi-1', 'epi-2', 'epi-3', 'epi-4', 'epi-5'],
  },
  {
    id: 'ref-2',
    type: 'reflection',
    content: '用户对深度学习的理解从理论到实践逐步深化',
    timestamp: daysAgo(11),
    importance: 9,
    insights: [
      '理论知识掌握扎实（反向传播、正则化等）',
      '能够将理论应用到实际项目中',
      '项目成功率高，说明理解深入',
    ],
    sourceMemoryIds: ['sem-2', 'sem-3', 'sem-5', 'epi-4', 'epi-6'],
  },
  {
    id: 'ref-3',
    type: 'reflection',
    content: '用户在图像处理领域展现出特别的兴趣和天赋',
    timestamp: daysAgo(7),
    importance: 9,
    insights: [
      'CNN 项目完成度高',
      '快速掌握了迁移学习',
      '对计算机视觉相关技术特别关注',
    ],
    sourceMemoryIds: ['epi-5', 'epi-6', 'epi-7', 'sem-6', 'sem-7'],
  },
  {
    id: 'ref-4',
    type: 'reflection',
    content: '用户的技术栈偏好：PyTorch + 预训练模型 + 实用主义方法',
    timestamp: daysAgo(4),
    importance: 8,
    insights: [
      '选择 PyTorch 作为主要框架',
      '倾向使用成熟的预训练模型',
      '注重实际效果而非从零开始',
    ],
    sourceMemoryIds: ['stm-4', 'epi-8', 'sem-8', 'sem-9'],
  },
  {
    id: 'ref-5',
    type: 'reflection',
    content: '用户当前处于从中级向高级过渡的阶段',
    timestamp: daysAgo(2),
    importance: 10,
    insights: [
      '基础知识已经牢固',
      '开始探索高级技术（迁移学习、ResNet）',
      '项目复杂度逐步提升',
      '建议引入更多实战项目和前沿技术',
    ],
    sourceMemoryIds: ['ref-1', 'ref-2', 'ref-3', 'epi-6', 'epi-8'],
  },
];

// 记忆关系（用于图谱可视化）
export interface MemoryRelationship {
  source: string;
  target: string;
  type: 'reflection' | 'semantic' | 'temporal';
}

export const mockRelationships: MemoryRelationship[] = [
  // Reflection 关系
  { source: 'epi-1', target: 'ref-1', type: 'reflection' },
  { source: 'epi-2', target: 'ref-1', type: 'reflection' },
  { source: 'epi-3', target: 'ref-1', type: 'reflection' },
  { source: 'epi-4', target: 'ref-1', type: 'reflection' },
  { source: 'epi-5', target: 'ref-1', type: 'reflection' },
  
  { source: 'sem-2', target: 'ref-2', type: 'reflection' },
  { source: 'sem-3', target: 'ref-2', type: 'reflection' },
  { source: 'sem-5', target: 'ref-2', type: 'reflection' },
  { source: 'epi-4', target: 'ref-2', type: 'reflection' },
  { source: 'epi-6', target: 'ref-2', type: 'reflection' },
  
  { source: 'epi-5', target: 'ref-3', type: 'reflection' },
  { source: 'epi-6', target: 'ref-3', type: 'reflection' },
  { source: 'epi-7', target: 'ref-3', type: 'reflection' },
  { source: 'sem-6', target: 'ref-3', type: 'reflection' },
  { source: 'sem-7', target: 'ref-3', type: 'reflection' },
  
  { source: 'stm-4', target: 'ref-4', type: 'reflection' },
  { source: 'epi-8', target: 'ref-4', type: 'reflection' },
  { source: 'sem-8', target: 'ref-4', type: 'reflection' },
  { source: 'sem-9', target: 'ref-4', type: 'reflection' },
  
  { source: 'ref-1', target: 'ref-5', type: 'reflection' },
  { source: 'ref-2', target: 'ref-5', type: 'reflection' },
  { source: 'ref-3', target: 'ref-5', type: 'reflection' },
  { source: 'epi-6', target: 'ref-5', type: 'reflection' },
  { source: 'epi-8', target: 'ref-5', type: 'reflection' },
  
  // Semantic 关系（知识关联）
  { source: 'sem-1', target: 'sem-2', type: 'semantic' },
  { source: 'sem-2', target: 'sem-3', type: 'semantic' },
  { source: 'sem-4', target: 'sem-5', type: 'semantic' },
  { source: 'sem-2', target: 'sem-6', type: 'semantic' },
  { source: 'sem-6', target: 'sem-7', type: 'semantic' },
  { source: 'sem-6', target: 'sem-8', type: 'semantic' },
  { source: 'sem-2', target: 'sem-9', type: 'semantic' },
  
  // Temporal 关系（时间相关）
  { source: 'epi-1', target: 'epi-2', type: 'temporal' },
  { source: 'epi-2', target: 'epi-3', type: 'temporal' },
  { source: 'epi-3', target: 'epi-4', type: 'temporal' },
  { source: 'epi-4', target: 'epi-5', type: 'temporal' },
  { source: 'epi-5', target: 'epi-6', type: 'temporal' },
  { source: 'epi-6', target: 'epi-7', type: 'temporal' },
  { source: 'epi-7', target: 'epi-8', type: 'temporal' },
];
