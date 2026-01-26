# Skill Creator - 技能创建器

## 功能概述

Skill Creator 是一个智能化的 AI 技能创建系统，允许用户通过上传本地文件，自动分析并生成可复用的 skill 配置。

### 核心功能

1. **文件上传** - 支持拖拽上传多种文件格式（文本、文档、代码）
2. **AI 分析** - 自动分析文件内容，提取用户的工作领域和技能
3. **技能生成** - 根据分析结果自动生成 skill 配置
4. **预览编辑** - 用户可以预览和调整生成的 skill
5. **技能管理** - 查看、编辑、删除已创建的 skills
6. **在线使用** - 提供交互界面来使用创建的 skill 完成任务

### 支持的文件格式

- **文本文件**: .txt, .md, .json
- **文档文件**: .pdf, .docx
- **代码文件**: .js, .ts, .py, .java, .tsx, .jsx

## 项目结构

```
├── frontend/skills-replica/          # 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   └── skill-creator/       # Skill Creator 组件
│   │   │       ├── FileUploadZone.tsx
│   │   │       ├── AnalysisProgress.tsx
│   │   │       ├── SkillPreviewEditor.tsx
│   │   │       ├── SkillExecutor.tsx
│   │   │       └── MySkillsLibrary.tsx
│   │   ├── pages/
│   │   │   └── SkillCreatorPage.tsx
│   │   ├── hooks/
│   │   │   ├── useFileUpload.ts
│   │   │   └── useSkillAnalysis.ts
│   │   ├── types/
│   │   │   └── skill-creator.ts
│   │   ├── utils/
│   │   │   ├── file-validation.ts
│   │   │   └── error-handling.ts
│   │   └── lib/
│   │       └── api-client.ts
│   └── package.json
│
├── services/skill-creator-service/   # 后端服务
│   ├── src/
│   │   ├── index.ts                  # 主服务器
│   │   ├── file-extractor.ts         # 文件内容提取
│   │   ├── content-analyzer.ts       # AI 内容分析
│   │   ├── skill-generator.ts        # 技能生成
│   │   └── skill-manager.ts          # 技能管理
│   └── package.json
│
├── services/api-gateway/             # API 网关
│   └── src/routes/skills.ts          # Skill API 路由
│
└── packages/database/                # 数据库
    └── prisma/schema.prisma          # 数据库模式
```

## 安装和运行

### 前置要求

- Node.js 18+
- pnpm
- PostgreSQL
- OpenAI API Key

### 1. 安装依赖

```bash
# 根目录安装所有依赖
pnpm install

# 安装前端依赖
cd frontend/skills-replica
pnpm install

# 安装后端服务依赖
cd services/skill-creator-service
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/agent_memory"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# 服务端口
PORT=3001

# API Gateway
SKILL_CREATOR_SERVICE_URL="http://localhost:3001"
```

### 3. 数据库迁移

```bash
cd packages/database
npx prisma migrate dev
```

### 4. 启动服务

```bash
# 启动 Skill Creator 服务
cd services/skill-creator-service
pnpm dev

# 启动 API Gateway（另一个终端）
cd services/api-gateway
pnpm dev

# 启动前端（另一个终端）
cd frontend/skills-replica
pnpm dev
```

### 5. 访问应用

打开浏览器访问: `http://localhost:5173`

## 使用流程

### 创建技能

1. 登录后，点击导航栏的 "创建技能" 按钮
2. 上传你的文件（拖拽或点击选择）
3. 点击 "开始分析"，等待 AI 分析完成
4. 预览生成的技能配置，可以编辑名称、描述和分类
5. 点击 "保存技能" 完成创建

### 管理技能

1. 点击导航栏的 "我的技能" 查看所有创建的技能
2. 可以搜索和筛选技能
3. 点击 "使用" 按钮在线使用技能
4. 点击删除按钮删除不需要的技能

### 使用技能

1. 在技能库中点击 "使用" 按钮
2. 在输入框中输入你的问题或任务
3. 点击 "执行技能" 或按 Cmd/Ctrl + Enter
4. 查看 AI 生成的输出结果
5. 可以查看执行历史

## API 端点

### 文件上传
```
POST /api/v1/skills/create/upload
```

### 分析文件
```
POST /api/v1/skills/create/analyze
```

### 获取分析状态
```
GET /api/v1/skills/create/status/:jobId
```

### 生成技能
```
POST /api/v1/skills/create/generate
```

### 保存技能
```
POST /api/v1/skills
```

### 获取用户技能
```
GET /api/v1/skills
```

### 更新技能
```
PUT /api/v1/skills/:skillId
```

### 删除技能
```
DELETE /api/v1/skills/:skillId
```

### 执行技能
```
POST /api/v1/skills/:skillId/execute
```

### 获取执行历史
```
GET /api/v1/skills/:skillId/history
```

## 技术栈

### 前端
- React 19
- TypeScript
- Tailwind CSS
- React Router
- Axios
- React Dropzone

### 后端
- Node.js
- Express
- TypeScript
- Multer (文件上传)
- pdf-parse (PDF 解析)
- mammoth (DOCX 解析)
- OpenAI API

### 数据库
- PostgreSQL
- Prisma ORM

## 开发注意事项

1. **文件大小限制**: 每个文件最大 10MB
2. **文件数量限制**: 一次最多上传 10 个文件
3. **OpenAI API**: 需要有效的 API Key 才能使用分析功能
4. **数据库**: 确保 PostgreSQL 正在运行并且连接配置正确

## 故障排除

### 文件上传失败
- 检查文件大小是否超过 10MB
- 检查文件格式是否支持
- 检查网络连接

### 分析失败
- 检查 OpenAI API Key 是否有效
- 检查 API 配额是否用完
- 查看服务器日志获取详细错误信息

### 数据库连接失败
- 检查 PostgreSQL 是否运行
- 检查 DATABASE_URL 配置是否正确
- 运行数据库迁移: `npx prisma migrate dev`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
