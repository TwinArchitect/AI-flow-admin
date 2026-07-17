# 迁移方案：Dashboard + Agent 模块

> **原型项目**：`D:\project\agent-open-cloud-protal\src`
> **目标项目**：`d:\project\AI-flow-admin`
> **迁移范围**：Dashboard（首页）+ Agent 体系所有模块（含关联依赖）
> **迁移规范**：严格遵循 [STYLE_SPEC.md](./STYLE_SPEC.md)

---

## 一、迁移范围确认

### 1.1 直接迁移的页面（原型 → 目标）

```
原型 views/                      目标 features/
──────────────────────────────────────────────────
Dashboard.tsx                →   dashboard/DashboardPage.tsx（融合现有）
AgentOverview.tsx            →   agent/pages/AgentChatPage.tsx
AgentSquare.tsx              →   agent/pages/AgentSquarePage.tsx
AgentChat.tsx                →   agent/pages/AgentConversationPage.tsx
MyAgents.tsx                 →   agent/pages/MyAgentsPage.tsx（融合现有 AgentsPage）
AgentTagManagement.tsx       →   agent/pages/TagManagementPage.tsx
KnowledgeBase.tsx            →   agent/pages/KnowledgeBasePage.tsx
ModelManagement.tsx          →   agent/pages/ModelManagementPage.tsx
PluginCenter.tsx             →   agent/pages/PluginCenterPage.tsx
AgentOrchestration.tsx       →   agent/pages/OrchestrationPage.tsx
AgentMobileOverview.tsx      →   agent/pages/MobilePreviewPage.tsx
AgentMemory.tsx              →   agent/pages/MemoryPage.tsx
```

### 1.2 连锁依赖（必须一起迁移的 Feature）

Agent 模块不是孤立的页面，它依赖以下 Feature，必须同步迁移：

```
Agent 页面依赖图：
┌──────────────────────────────────────────────────┐
│                                                  │
│  AgentOverview ──┬── features/chat/              │
│                  ├── features/message-render/    │
│                  ├── features/message/           │
│                  ├── features/model/             │
│                  ├── features/workflow/（API层） │
│                  ├── features/agent/             │
│                  └── features/attachment/        │
│                                                  │
│  AgentOrchestration ──── features/workflow/（全部）│
│                     ├── features/agent/          │
│                     └── components/AgentTraffic* │
│                                                  │
│  MyAgents ──── features/agent/                  │
│           └── features/permission/（API+types）  │
│                                                  │
│  所有 Agent 页面 ──── components/toast/          │
│                 ──── components/dialog/         │
│                 ──── components/markdown/        │
│                 ──── context/（Auth+Theme）      │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 1.3 迁移总量估算

| 类别 | 数量 |
|------|------|
| 直接迁移的页面 | 12 个 |
| 需迁移的 Feature（各类 api/component/type/hook） | 8 个 |
| 需迁移的公共组件（toast/dialog/markdown） | 3 个 |
| 需迁移的 Context | 1 个（TabContext，可选） |

---

## 二、Dashboard 迁移方案

### 2.1 当前状态

当前项目已有 [DashboardPage.tsx](../src/features/dashboard/DashboardPage.tsx)（287 行），包含：
- 4 个统计卡片（API调用量、活跃智能体、平均延迟、Token用量）
- 自建 SVG 面积图 + 柱状图
- 系统状态面板 + 智能体排行榜表格

### 2.2 融合策略：保留现有 + 融入原项目精华

```
现有 Dashboard（保留）        原项目 Dashboard（融入）
─────────────────────       ─────────────────────
统计卡片行                   → 扩展为 5-6 卡片
AreaChart + BarChart         → 保留，样式升级
系统状态面板                 → 保留，融入更多状态项
智能体排行表格               → 保留，升级为 DataTable
                            → ＋ Hero Banner（Section 1，可折叠）
                            → ＋ 五大核心能力 Bento Grid（Section 3）
                            → ＋ 六大优势展示（Section 5）
```

### 2.3 原项目样式 → 目标项目样式对照

> 以下是从原项目 Dashboard 中提取的高频样式映射，迁移时按此表逐项替换。

#### 背景色
| 原项目 | 目标项目 |
|--------|---------|
| `bg-slate-50` | `bg-background` |
| `bg-white dark:bg-slate-900` | `bg-card` |
| `bg-slate-950` | `bg-card`（暗色主题自动适配） |
| `bg-slate-900/40` | `bg-muted/40` |
| `bg-white/5` | `bg-card/5` |
| `bg-[radial-gradient(circle_at_80%_20%,#312e81,transparent_50%)]` | 保留（渐变背景允许任意值） |

#### 文字色
| 原项目 | 目标项目 |
|--------|---------|
| `text-slate-900 dark:text-white` | `text-foreground` |
| `text-slate-500 dark:text-slate-400` | `text-muted-foreground` |
| `text-slate-400` | `text-fg-subtle` |
| `text-slate-100` / `text-slate-200` | `text-foreground` |
| `text-brand-600 dark:text-brand-400` | `text-primary` |
| `text-blue-300` / `text-purple-300`（彩色标签） | 保留（渐变/标识色允许） |

#### 边框
| 原项目 | 目标项目 |
|--------|---------|
| `border-slate-100 dark:border-slate-800` | `border-border` |
| `border-slate-200 dark:border-slate-700` | `border-border` |
| `border-slate-900/40` | `border-border/40` |

#### 圆角
| 原项目 | 目标项目 |
|--------|---------|
| `rounded-[32px]` | `rounded-[32px]`（超出 --radius-2xl=24px，保留精确值） |
| `rounded-[28px]` | `rounded-[28px]` |
| `rounded-[24px]` | `rounded-2xl` |
| `rounded-2xl` | `rounded-xl` |

#### 字号
| 原项目 | 目标项目 |
|--------|---------|
| `text-[10px]`、`text-[11px]` | `text-2xs` |
| `text-[9px]` | `text-2xs` |
| `text-[17px]` | `text-base` 或 `text-lg` |
| `text-3xl` | `text-2xl` |
| `text-5xl` | `text-3xl` |
| `text-[54px]` | `text-4xl` |

#### 布局宽高
| 原项目（❌固定） | 目标项目（✅响应式） |
|----------------|------------------|
| `max-w-5xl` | `max-w-5xl`（OK，是约束不是固定） |
| `min-h-[180px]` | `min-h-44` 或保留 |
| `min-w-[120px]`（卡片内部标签） | 保留（内部元素允许） |
| `w-[1px]`（分割线） | 保留（小装饰元素允许） |

### 2.4 Dashboard 迁移产出

```
src/features/dashboard/
├── DashboardPage.tsx          # 重写（融合版）
├── components/
│   ├── HeroBanner.tsx         # 新增：Section 1 品牌展示区
│   ├── CapabilityCards.tsx    # 新增：Section 3 五大能力卡片
│   ├── AdvantageGrid.tsx      # 新增：Section 5 六大优势
│   └── ArchitectureView.tsx   # 新增：Section 4 平台架构（可选）
└── index.ts
```

---

## 三、Agent 体系迁移方案

### 3.1 迁移顺序（按依赖关系）

```
Phase 1: 基础设施（必须先完成，Agent 页面依赖这些）
  ├── context/AuthContext → 融入现有 stores/auth.ts
  ├── context/ThemeContext → 融入现有 stores/theme.ts
  ├── components/toast/ → 替换为 sonner（已有）
  ├── components/dialog/ → 替换为 Dialog（shadcn）
  └── components/markdown/ → 适配到目标项目

Phase 2: Feature 层（数据+业务）
  ├── features/agent/      （types + api + components + hooks）
  ├── features/model/      （types + api）
  ├── features/chat/       （types + api + utils）
  ├── features/message/    （types + api + hooks）
  ├── features/message-render/ （完整迁移，AgentOverview/Chat 核心依赖）
  ├── features/attachment/ （types + api，文件上传能力）
  └── features/workflow/   （API 层，AgentOrchestration 需全部）

Phase 3: 页面层
  ├── AgentOverview     → 核心智能助手页
  ├── AgentSquare       → 智能体广场
  ├── AgentChat         → 智能体对话页
  ├── MyAgents          → 我的智能体
  ├── ModelManagement   → 模型管理
  ├── PluginCenter      → 插件中心
  ├── AgentOrchestration → 工作流编排（依赖 workflow 全部）
  ├── KnowledgeBase     → 知识库
  ├── AgentTagManagement → 标签管理
  ├── AgentMemory       → 记忆维护
  └── AgentMobileOverview → 移动端预览
```

### 3.2 Agent Feature 迁移详情

#### 3.2.1 `features/agent/` — Agent 核心

**原型文件**：
```
features/agent/
├── api/agentApi.ts, agentApiKeyApi.ts, agentLabelApi.ts, agentMonitorApi.ts
├── components/AgentAvatarDisplay.tsx, AgentAvatarPicker.tsx, AgentListCard.tsx, AgentModelSelect.tsx
├── constants/agentAvatarIcons.ts
├── dialogs/AgentPublishDialog.tsx, CreateAgentDialog.tsx, EditAgentDialog.tsx, ...
├── hooks/useEnabledAgentLabels.ts
├── panels/AgentPublishChannelPanel.tsx
├── types.ts, types/agentApiKey.ts, types/agentLabel.ts, types/agentMonitor.ts
├── utils/agentSetting.ts, agentTags.ts
└── content/ (文档)
```

**迁移映射**：

| 原文件 | → 目标位置 | 处理方式 |
|--------|-----------|---------|
| `api/*.ts` | → `src/api/agent*.ts`（拆分到统一 API 层） | 改用 `src/api/client.ts` 的 http 实例 |
| `types/*.ts` | → `src/types/agent*.ts` | 保留类型定义，改用 `export type` |
| `components/AgentAvatarDisplay.tsx` | → `src/features/agent/components/` | 样式替换为语义 class |
| `components/AgentAvatarPicker.tsx` | → 同上 | 使用 shadcn `Dialog` + `Avatar` |
| `components/AgentListCard.tsx` | → 同上 | 使用 shadcn `Card` + `Badge` |
| `components/AgentModelSelect.tsx` | → 同上 | 使用 shadcn `Select` |
| `dialogs/CreateAgentDialog.tsx` | → `src/features/agent/components/` | 使用 shadcn `Dialog` + `Form` |
| `dialogs/EditAgentDialog.tsx` | → 同上 | 同上 |
| `dialogs/AgentPublishDialog.tsx` | → 同上 | 同上 |
| `panels/AgentPublishChannelPanel.tsx` | → `src/features/agent/components/` | 同上 |
| `hooks/useEnabledAgentLabels.ts` | → `src/hooks/useAgentLabels.ts` | 改用 React Query pattern |

#### 3.2.2 `features/chat/` — 对话功能

AgentOverview 和 AgentChat 都依赖此 Feature。

```
原型: features/chat/
├── api/chatApi.ts          → src/api/chat.ts（改用统一 client）
├── components/AgentPickerModal.tsx  → 使用 shadcn Dialog
├── constants/testAgents.ts → 保留（测试预设）
├── types.ts                → src/types/chat.ts
└── utils/overviewMessages.ts → src/lib/chatMessages.ts
```

#### 3.2.3 `features/message-render/` — 消息块渲染引擎 ⚠️ 关键依赖

这是 AgentOverview/Chat 的核心依赖，负责将 API 返回的 SSE 事件流渲染为可交互的消息块。

```
原型: features/message-render/
├── MessageContent.tsx          # 主渲染入口
├── registry.ts                 # 块类型注册器
├── types.ts                    # MessageBlock, ContentDelta 等
├── adapters/
│   ├── sseEventAdapter.ts      # SSE 事件 → ContentDelta
│   ├── stringAdapter.ts        # 文本 → MessageBlock[]
│   ├── blockMutations.ts       # applyContentDelta
│   ├── attachmentBlocks.ts
│   └── workflowSseTypes.ts
├── blocks/
│   ├── MarkdownBlock.tsx       # Markdown 渲染块
│   ├── ReasoningBlock.tsx      # 推理过程块
│   ├── TextBlock.tsx           # 纯文本块
│   ├── ImageBlock.tsx          # 图片块
│   ├── HtmlBlock.tsx           # HTML 块
│   ├── AttachmentBlock.tsx     # 附件块
│   └── CustomBlock.tsx         # 自定义块
└── index.ts
```

**迁移策略：逻辑层全量迁移，渲染层适配。**

| 部分 | 处理 |
|------|------|
| `types.ts`、`registry.ts`、`adapters/` | **全量迁移**，这是纯逻辑，不涉及 UI 样式 |
| `blocks/MarkdownBlock.tsx` | 保留逻辑，使用目标项目的 Markdown 渲染方案 |
| `blocks/ReasoningBlock.tsx` | 使用 shadcn `Accordion` 替代自建折叠 |
| `blocks/TextBlock.tsx` | 使用目标项目的文字样式 class |
| `blocks/ImageBlock.tsx` | 使用 `Dialog` 预览图片 |
| `blocks/AttachmentBlock.tsx` | 使用 shadcn `Card` + `Button` |

**目标目录**：
```
src/features/message-render/
├── MessageContent.tsx
├── registry.ts
├── types.ts
├── adapters/
│   └── *.ts
├── blocks/
│   └── *.tsx  （样式适配版）
└── index.ts
```

#### 3.2.4 `features/workflow/` — 工作流（Agent 依赖）

AgentOverview 调用 `runWorkflowStream`（API 层），AgentOrchestration 依赖整个 workflow 编辑器。

**当前项目已有 `src/features/workflows/`**，不需要完整迁移原型的工作流系统。只需：

| 原型需要的能力 | 处理方式 |
|--------------|---------|
| `api/workflowRunApi.ts` | 当前项目已有 `features/workflows/api/workflowRunApi.ts`，直接使用 |
| `hooks/useWorkflowModels.ts` | 新增到当前项目 `features/workflows/hooks/` |
| `runWorkflowStream`（SSE 流式执行） | 对比两个项目的实现，选择更完整的一方 |
| AgentOrchestration 页面的 WorkflowEditor | 使用当前项目的 `WorkflowCanvas` + 增强调试面板 |

#### 3.2.5 `features/model/` — 模型管理

```
原型: features/model/
├── api/modelApi.ts         → src/api/model.ts
├── types.ts                → src/types/model.ts
└── utils.ts                → 保留
```

#### 3.2.6 `features/message/` — 消息管理

```
原型: features/message/
├── api/messageApi.ts       → src/api/message.ts
├── hooks/useMessageUnread.ts → src/hooks/useMessageUnread.ts
├── types.ts                → src/types/message.ts
├── components/             → 适配样式
├── panels/                 → 适配样式
└── dialogs/                → 适配样式
```

#### 3.2.7 `features/attachment/` — 附件/文件

```
原型: features/attachment/
├── api/fileApi.ts          → src/api/file.ts
├── api/uploadApi.ts        → src/api/upload.ts
├── types.ts                → src/types/attachment.ts
└── utils.ts                → 保留
```

组件（ImagePreview/FilePreview/UploadProgress）适配为 shadcn 组件。

---

## 四、公共组件迁移

### 4.1 Toast → sonner（已有）

原项目自建 ToastProvider，当前项目已集成 sonner。迁移方式：全局替换 `useToast()` 调用。

```tsx
// ❌ 原项目
import { useToast } from '../components/toast';
toast.success('操作成功');
toast.error('操作失败');

// ✅ 迁移后
import { toast } from 'sonner';
toast.success('操作成功');
toast.error('操作失败');
```

### 4.2 ConfirmDialog → shadcn Dialog

```tsx
// ❌ 原项目（自建）
<ConfirmDialog open={open} title="删除" tone="danger"
  onConfirm={handleDelete} onClose={() => setOpen(false)} />

// ✅ 迁移后（shadcn）
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>删除确认</DialogTitle></DialogHeader>
    <p>确定要删除吗？</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
      <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4.3 Markdown → react-markdown（需安装）

原项目使用 `react-markdown` + `remark-gfm`，当前项目未安装。需要：

```bash
pnpm add react-markdown remark-gfm
```

然后将原项目的 `ReactMarkdownView.tsx` 适配到目标项目样式体系。

### 4.4 UI 组件映射（权限系统用）

原项目 `features/permission/components/ui.tsx` 中的自建组件：

| 原项目 | → 目标项目 |
|--------|-----------|
| `IconButton` | `<Button variant="ghost" size="icon-sm">` |
| `PrimaryButton` | `<Button>` |
| `SecondaryButton` | `<Button variant="secondary">` |
| `EmptyState` | 简化为 `<div className="py-12 text-center text-muted-foreground">` |
| `Dialog` | `<Dialog>` (shadcn) |
| `Field` | `<FormItem>` + `<FormControl>` |
| `DialogActions` | `<DialogFooter>` |
| `FormShell` | `<Form>` (shadcn) |
| `LoadingOverlay` | `<Skeleton>` |
| `NoticeBanner` | `<Alert variant="destructive">` |
| `Pagination` | DataTable 内置分页 |

---

## 五、状态管理层迁移

### 5.1 AuthContext → 现有 stores/auth.ts（已有）

目标项目已有 `useAuthStore`（Zustand），不需要迁移原项目的 AuthContext。但需在目标项目中补充：

- `isPlatformAdmin` / `isTenantSystemAdmin` 字段（如需）
- `tenantId` 字段

### 5.2 ThemeContext → 现有 stores/theme.ts（已有）

目标项目已有完整的 ThemeStore，不需迁移。

### 5.3 TabContext → 新增（可选）

原项目的多 Tab 页面导航功能，目标项目没有。如果 Agent 页面需要此功能，需新增：

```tsx
// src/stores/tabs.ts
// 或作为 MainLayout 的可选功能（Phase 2 再评估）
```

---

## 六、npm 依赖补充

Agent 模块迁移需要以下当前项目未安装的依赖：

```bash
pnpm add react-markdown remark-gfm recharts xlsx
```

| 依赖 | 用途 | Agent 页面依赖 |
|------|------|-------------|
| `react-markdown` | Markdown 渲染 | AgentOverview, AgentChat |
| `remark-gfm` | GFM 扩展（表格/任务列表） | AgentOverview, AgentChat |
| `recharts` | 图表（AgentTrafficMonitor） | AgentOrchestration |
| `xlsx` | Excel 导入/导出 | 部分管理页面 |

---

## 七、迁移执行步骤

### Step 1：补齐依赖（0.5 day）

```bash
# 安装缺失的 npm 包
pnpm add react-markdown remark-gfm recharts xlsx

# 确认已有依赖版本兼容
# @xyflow/react: 两边都是 ^12.11.1 ✅
# lucide-react: 原型 0.546 vs 目标 0.400 → 检查 API 差异
# motion vs framer-motion: import 路径改一下即可
```

### Step 2：迁移 Feature 数据层（1 day）

按以下顺序迁移（先数据后视图，先独立后依赖）：

```
1. types/      → agent.ts, chat.ts, model.ts, message.ts（1h）
2. api/        → agent, chat, model, message, workflow API（2h）
3. hooks/      → React Query pattern 包装（2h）
4. utils/      → 工具函数迁移（1h）
```

### Step 3：迁移 message-render 引擎（1 day）

这是核心依赖，AgentOverview/Chat 都依赖它。

1. 迁移 `types.ts`、`registry.ts`、`adapters/`（纯逻辑，直接迁移）
2. 适配 `blocks/` 渲染组件到目标项目样式
3. 适配 `MarkdownBlock`（引入 react-markdown）

### Step 4：迁移 Dashboard（1 day）

融合两个 Dashboard：
1. 保留当前项目的统计卡片和图表
2. 从原项目融入 HeroBanner、CapabilityCards、AdvantageGrid
3. 全部样式替换为语义 class

### Step 5：迁移 Agent 页面（3-4 days）

按复杂度排序：

```
Day 1-2: AgentOverview（核心，最复杂）
  ├── ChatInputArea（适配 shadcn Input + Button）
  ├── 消息列表（适配 message-render）
  ├── 侧栏（会话列表，适配 shadcn）
  └── AgentPickerModal（适配 shadcn Dialog）

Day 2-3: AgentSquare + AgentChat
  ├── 卡片网格 + 轮播 Banner
  └── 对话交互

Day 3: MyAgents + ModelManagement
  ├── 融合现有 AgentsPage
  └── DataTable + Dialog 模式

Day 4: PluginCenter + KnowledgeBase + 其余
  ├── 双模式页面（市场/管理）
  └── CRUD 模式
```

### Step 6：AgentOrchestration（1 day，可选）

依赖 workflow 编辑器。因当前项目已有，只需要：
1. 将原项目的调试面板整合进来
2. 将原项目的 PublishChannelPanel 整合进来

---

## 八、样式迁移辅助工具

以下正则可以帮助批量替换原项目中的高频违规样式：

```bash
# 背景色替换（在目标项目 src 目录执行）
# bg-slate-50 → bg-background (需人工判断上下文)
# text-slate-900 dark:text-white → text-foreground
# border-slate-100 dark:border-slate-800 → border-border
```

| 原项目批量模式 | 替换为 |
|--------------|--------|
| `bg-slate-50\b` | `bg-background` |
| `\btext-slate-900\b` | `text-foreground` |
| `\btext-slate-500\b` | `text-muted-foreground` |
| `\btext-slate-400\b` | `text-fg-subtle` |
| `\bborder-slate-100\b` | `border-border` |
| `\bborder-slate-200\b` | `border-border` |
| `\btext-brand-600\b` | `text-primary` |
| `\bbg-brand-600\b` | `bg-primary` |
| `\bbg-brand-500\b` | `bg-primary` |
| `\bhover:bg-brand-700\b` | `hover:bg-primary/90` |
| `'motion/react'` | `'framer-motion'` |
| `\btext-emerald-500\b` | `text-success` |
| `\btext-rose-500\b` | `text-destructive` |
| `\btext-amber-500\b` | `text-warning` |

---

## 九、注意事项

1. **react-markdown 引入**：当前项目未安装，需评估是否用简化方案（纯文本展示）
2. **motion → framer-motion**：原项目用 `motion` 包，API 兼容，改 import 即可
3. **lucide-react 版本**：原型 `^0.546` vs 目标 `^0.400`，新版本可能新增了图标，需检查
4. **AgentMobileOverview**：这是一个手机模拟器页面，纯前端展示，不依赖后端
5. **AgentMemory**：依赖后端记忆 API，需确认后端是否就绪
6. **品牌 Logo**：原项目使用内联 SVG（华能），迁移时确认是否变更
7. **TabContext**：原项目有多 Tab 导航，如保留需新增此功能
8. **@xyflow/react 版本一致**：两边都是 `^12.11.1`，workflow 相关无冲突
