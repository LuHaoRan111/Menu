# 题库管理系统

这是一个基于React和Koa的题库管理系统，支持题库管理、AI出题等功能。

## 技术栈

### 前端
- React
- TypeScript
- Ant Design
- React Router
- Marked (Markdown渲染)
- Axios

### 后端
- Koa
- Prisma ORM
- SQLite
- Node.js

## 功能特性

- 展示学习心得（Markdown格式）
- 题库管理
  - 题目列表展示
  - 分页、筛选、搜索
  - 添加、编辑、删除题目
  - 批量删除题目
- AI出题功能
  - 生成预览题目
  - 选择合适题目添加到题库

## 如何运行

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd server
# 设置环境变量
echo "DATABASE_URL=file:./dev.db" > .env
# 应用Prisma迁移
npx prisma migrate dev
```

### 3. 开发模式运行

```bash
# 运行后端
cd server
npm start

# 运行前端（新终端）
cd client
npm run dev
```

前端默认运行在 http://localhost:3000
后端API运行在 http://localhost:8080/api

### 4. 生产环境构建

```bash
# 构建前端
cd client
npm run build

# 启动服务
cd ../server
npm start
```

访问 http://localhost:8080 即可使用系统

## 项目结构

```
├── client/               # 前端代码
│   ├── src/              # 源代码
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── utils/        # 工具函数
│   │   └── types/        # 类型定义
│   └── dist/             # 构建产物
├── server/               # 后端代码
│   ├── controller/       # 控制器
│   ├── router/           # 路由
│   ├── middleware/       # 中间件
│   ├── prisma/           # Prisma配置
│   └── model/            # 模型
└── study-note.md         # 学习心得
``` 