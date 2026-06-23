# AI Flow Admin

面向 AI 工作流平台的前端管理端工程，当前阶段以 **UI 原型与样式交付** 为主，后续逐步接入真实业务接口。

## 技术栈（当前实际）

| 分类 | 技术 |
|---|---|
| 核心框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 样式体系 | Tailwind CSS v4 + Design Tokens |
| 组件体系 | shadcn/ui + Radix UI |
| 路由 | React Router v6 |
| 服务端状态 | TanStack React Query v5 |
| 客户端状态 | Zustand |
| HTTP | Axios |
| 表格 | TanStack Table v8 |
| 表单 | React Hook Form + Zod |
| 通知 | Sonner |
| 图标 | Lucide React |

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发

```bash
pnpm dev
```

### 质量检查

```bash
pnpm lint
pnpm stylelint
pnpm type-check
pnpm format
```

## 项目结构

```text
src/
├── api/                    # axios 请求层（client + 业务接口）
├── components/
│   ├── layout/             # 布局组件
│   └── ui/                 # 通用 UI 组件（含 DataTable）
├── features/               # 业务模块（auth/dashboard/users/...）
├── hooks/                  # React Query 业务 hooks
├── lib/                    # 通用工具函数
├── routes/                 # 路由与守卫
├── stores/                 # Zustand 状态管理
├── styles/                 # 全局样式与 Token
└── types/                  # 类型定义
```

## UI 阶段开发约定

- 优先使用 `src/components/ui` 内现有组件，避免重复造轮子。
- 样式优先 Tailwind 类名，不使用内联 `style`。
- 颜色、间距、字号优先语义 token（如 `bg-background`、`text-foreground`）。
- 页面以“静态交付”为主，不提前引入业务耦合代码。

## DataTable 使用

`src/components/ui/data-table.tsx` 已支持：

- 排序、筛选、分页、列显隐、行选择
- 列拖拽排序（`enableColumnReordering`）
- 列宽拖动（`enableColumnResizing`）

示例见：`src/features/components/demos/TableDemo.tsx`。

## 图标库使用

项目使用 [Lucide React](https://lucide.dev/icons)，官网可直接搜索和预览所有图标。

**命名规则**：官网图标名转为 PascalCase 即为组件名。

```tsx
import { Workflow, Settings, Users, Search } from 'lucide-react';

<Workflow size={24} className="text-foreground" />
<Settings size={20} className="text-muted-foreground" />
```

## 环境变量

复制 `.env.example` 为 `.env.development` 后按需配置：

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

## 文档导航

- 架构规划与后续工期：`PROJECT.md`
- Tailwind + shadcn 实操：`shadcn-tailwind-使用文档.md`
- Token 体系说明：`TOKENS_GUIDE.md`

## 当前定位说明

本项目当前可稳定用于 **样式开发 / 原型交付 / 视觉走查**。  
真实业务接入后的补充项（上传、权限、动态路由、CRUD 脚手架等）已在 `PROJECT.md` 给出分阶段计划。
