# Developer Guide

## 目录

1. [项目架构](#项目架构)
2. [开发环境设置](#开发环境设置)
3. [项目结构](#项目结构)
4. [核心概念](#核心概念)
5. [组件开发](#组件开发)
6. [状态管理](#状态管理)
7. [API 集成](#api-集成)
8. [样式指南](#样式指南)
9. [测试](#测试)
10. [构建和部署](#构建和部署)
11. [贡献指南](#贡献指南)

## 项目架构

### 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand + React Query
- **样式**: Tailwind CSS
- **可视化**: D3.js + Recharts
- **区块链**: Solana Web3.js + Wallet Adapter
- **实时通信**: Socket.IO Client

### 架构模式

- **组件化**: 功能模块化，可复用组件
- **状态分离**: 全局状态 (Zustand) + 服务器状态 (React Query)
- **类型安全**: 完整的 TypeScript 类型定义
- **响应式设计**: 移动优先，渐进增强

## 开发环境设置

### 前置要求

- Node.js 18+ 
- npm 9+ 或 pnpm 8+
- Git

### 安装步骤

```bash
# 克隆仓库
git clone <repository-url>
cd frontend/chat-interface

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Solana Configuration
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Feature Flags
VITE_ENABLE_BLOCKCHAIN=true
VITE_ENABLE_RAG=true
```

### 开发工具

推荐使用以下 VS Code 扩展:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

## 项目结构

```
src/
├── api/                    # API 客户端
│   ├── client.ts          # Axios 配置
│   ├── chat.ts            # 聊天 API
│   ├── memory.ts          # 记忆 API
│   ├── visualization.ts   # 可视化 API
│   ├── blockchain.ts      # 区块链 API
│   └── websocket.ts       # WebSocket 客户端
├── components/            # React 组件
│   ├── ChatPanel.tsx
│   ├── VisualizationPanel.tsx
│   ├── SessionSidebar.tsx
│   └── ...
├── contexts/              # React Context
│   ├── ThemeContext.tsx
│   └── WalletContext.tsx
├── hooks/                 # 自定义 Hooks
│   ├── useQuery.ts
│   ├── useDebounce.ts
│   └── ...
├── stores/                # Zustand Stores
│   ├── chatStore.ts
│   ├── visualizationStore.ts
│   └── blockchainStore.ts
├── types/                 # TypeScript 类型
│   └── index.ts
├── utils/                 # 工具函数
│   ├── format.ts
│   └── validation.ts
├── App.tsx               # 根组件
└── main.tsx              # 入口文件
```

## 核心概念

### 状态管理策略

#### 全局状态 (Zustand)

用于客户端状态:
- 当前会话
- UI 状态
- 用户偏好

```typescript
// 示例: chatStore.ts
export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  
  selectSession: (sessionId: string) => {
    set({ currentSessionId: sessionId });
  },
}));
```

#### 服务器状态 (React Query)

用于服务器数据:
- 会话列表
- 消息历史
- 记忆数据

```typescript
// 示例: useQuery hook
const { data, isLoading } = useQuery({
  queryKey: ['sessions', agentId],
  queryFn: () => chatApi.getSessions(agentId),
});
```

### 组件设计原则

1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 提取通用逻辑到自定义 hooks
3. **类型安全**: 所有 props 和状态都有类型定义
4. **性能优化**: 使用 memo、useMemo、useCallback

### API 集成模式

```typescript
// API 客户端结构
export const chatApi = {
  sendMessage: async (agentId: string, data: SendMessageRequest) => {
    const response = await apiClient.post(`/v1/agents/${agentId}/chat`, data);
    return response.data;
  },
  
  getMessages: async (agentId: string, sessionId: string, params: GetMessagesParams) => {
    const response = await apiClient.get(`/v1/agents/${agentId}/sessions/${sessionId}/messages`, { params });
    return response.data;
  },
};
```

## 组件开发

### 创建新组件

```typescript
// components/MyComponent.tsx
import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      <button 
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Action
      </button>
    </div>
  );
};
```

### 使用自定义 Hooks

```typescript
// hooks/useMyFeature.ts
import { useState, useEffect } from 'react';

export const useMyFeature = (param: string) => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // 逻辑实现
  }, [param]);
  
  return { data, loading };
};
```

### 性能优化

```typescript
import { memo, useMemo, useCallback } from 'react';

export const OptimizedComponent = memo(({ data }) => {
  // 缓存计算结果
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);
  
  // 缓存回调函数
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, []);
  
  return <div>{/* 渲染 */}</div>;
});
```

## 状态管理

### Zustand Store 模式

```typescript
interface MyStore {
  // State
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;
  
  // Actions
  loadItems: () => Promise<void>;
  selectItem: (id: string) => void;
  updateItem: (id: string, data: Partial<Item>) => void;
}

export const useMyStore = create<MyStore>((set, get) => ({
  items: [],
  selectedId: null,
  isLoading: false,
  
  loadItems: async () => {
    set({ isLoading: true });
    try {
      const items = await api.getItems();
      set({ items, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      // 错误处理
    }
  },
  
  selectItem: (id) => {
    set({ selectedId: id });
  },
  
  updateItem: (id, data) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }));
  },
}));
```

### React Query 使用

```typescript
// 查询
const { data, isLoading, error } = useQuery({
  queryKey: ['items', filter],
  queryFn: () => api.getItems(filter),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// 变更
const mutation = useMutation({
  mutationFn: (data: CreateItemData) => api.createItem(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

## API 集成

### HTTP 客户端配置

```typescript
// api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 错误处理
    return Promise.reject(error);
  }
);
```

### WebSocket 集成

```typescript
// api/websocket.ts
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }
  
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }
  
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsClient = new WebSocketClient();
```

## 样式指南

### Tailwind CSS 使用

```typescript
// 基础样式
<div className="p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <p className="mt-2 text-gray-600">Content</p>
</div>

// 响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 内容 */}
</div>

// 状态变化
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50">
  Button
</button>
```

### 主题系统

```typescript
// contexts/ThemeContext.tsx
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};
```

## 测试

### 单元测试

```typescript
// __tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" onAction={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('handles click', () => {
    const handleAction = jest.fn();
    render(<MyComponent title="Test" onAction={handleAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleAction).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
// __tests__/integration/ChatFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

describe('Chat Flow', () => {
  it('completes full chat flow', async () => {
    render(<App />);
    
    // 创建会话
    await userEvent.click(screen.getByText('New Session'));
    
    // 发送消息
    const input = screen.getByPlaceholderText('Type a message');
    await userEvent.type(input, 'Hello');
    await userEvent.click(screen.getByText('Send'));
    
    // 验证响应
    await waitFor(() => {
      expect(screen.getByText(/AI response/)).toBeInTheDocument();
    });
  });
});
```

## 构建和部署

### 本地构建

```bash
# 开发构建
npm run build

# 预览构建结果
npm run preview
```

### Docker 构建

```bash
# 构建镜像
docker build -t chat-interface .

# 运行容器
docker run -p 80:80 chat-interface
```

### 环境配置

```bash
# 开发环境
npm run dev

# 生产构建
npm run build -- --mode production

# 预发布环境
npm run build -- --mode staging
```

## 贡献指南

### 代码规范

1. **TypeScript**: 所有代码必须有类型定义
2. **ESLint**: 遵循项目 ESLint 配置
3. **Prettier**: 使用 Prettier 格式化代码
4. **命名**: 使用有意义的变量和函数名

### 提交规范

使用 Conventional Commits:

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### Pull Request 流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码审查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 通过了所有测试
- [ ] 没有引入新的警告

## 常见问题

### 如何添加新的 API 端点？

1. 在 `src/api/` 中添加 API 方法
2. 在 `src/types/` 中定义类型
3. 创建对应的 React Query hook
4. 在组件中使用

### 如何添加新的可视化组件？

1. 在 `src/components/` 中创建组件
2. 使用 D3.js 或 Recharts
3. 添加响应式支持
4. 优化性能（虚拟化、Canvas 渲染）

### 如何调试 WebSocket 连接？

1. 检查浏览器控制台
2. 使用 Chrome DevTools Network 标签
3. 检查服务器日志
4. 验证认证 token

## 资源链接

- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [React Query 文档](https://tanstack.com/query/latest)
- [D3.js 文档](https://d3js.org/)
- [Solana Web3.js 文档](https://solana-labs.github.io/solana-web3.js/)
