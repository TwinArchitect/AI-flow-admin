# AI Flow Admin — 前端样式开发规范（强制执行）

> **优先级：最高**。本规范是样式编写的唯一依据，所有开发者必须遵守。
>
> 配套参考文档：
> - [shadcn-tailwind-使用文档.md](../shadcn-tailwind-使用文档.md) — 原子写法速查
> - [src/styles/](../src/styles/) — 项目 Design Token 体系
>
> 本规范中的 **"禁止"** 条款由 ESLint 规则 `no-restricted-syntax`（禁止内联 `style`）和 Code Review 强制执行。

---

## 一、核心原则

```
样式来源优先级（从上到下，找到即停）：

  1. shadcn/ui 语义 class       →  bg-background, text-foreground, border-border, …
  2. 项目别名 class              →  bg-page, bg-surface, text-fg, text-fg-muted, border-line, bg-action, …
  3. Tailwind 原子 class         →  flex, grid, gap-4, p-4, rounded-lg, text-sm, font-semibold, …
  4. Tailwind 任意值             →  w-[320px], top-[72px], max-w-[860px]  （仅限尺寸/定位，见 §3.3）
  5. 全局 CSS 文件              →  仅限第三方库覆盖（如 React Flow），写在 src/styles/ 或模块级 .css
  6. ❌ 页面内新增 class/内联 style → 禁止
```

**一句话**：你要的样式，`src/styles/` + Tailwind 语义 class 已经提供了 95%，先查后写。

---

## 二、样式查找流程（每次开发新页面必须执行）

### 步骤 1：确认页面需要的视觉元素

在写任何 className 之前，列出你需要的 UI 元素：
- 背景色（页面背景、卡片背景、悬浮背景）
- 文字色（主文字、次要文字、禁用文字）
- 边框色（默认边框、分割线）
- 间距（内边距、外边距、gap）
- 字号/字重（标题、正文、辅助文字）
- 圆角、阴影

### 步骤 2：在 Design Token 中查找对应变量

打开以下文件，按需查找：

| 需要的样式 | 查找文件 | 可用变量/class |
|-----------|---------|---------------|
| 颜色（背景/文字/边框） | [src/styles/tokens/colors.css](../src/styles/tokens/colors.css) | `--color-bg-*`, `--color-text-*`, `--color-border-*` |
| 间距/圆角 | [src/styles/tokens/spacing.css](../src/styles/tokens/spacing.css) | `--space-*`, `--gap-*`, `--radius-*` |
| 字号/行高/字重 | [src/styles/tokens/typography.css](../src/styles/tokens/typography.css) | `--text-*`, `--leading-*`, `--font-*` |
| 阴影 | [src/styles/tokens/shadows.css](../src/styles/tokens/shadows.css) | `--shadow-*` |
| Tailwind @theme 映射 | [src/styles/index.css](../src/styles/index.css) (§@theme) | 所有可用 Tailwind class → token 映射 |

### 步骤 3：在 [shadcn-tailwind-使用文档.md](../shadcn-tailwind-使用文档.md) 中查找对应的 Tailwind class 写法

该文档第 11 节提供了完整的语义 class 速查表。将 Token 变量映射为 Tailwind class：

| 你想表达 | ❌ 错误写法 | ✅ 正确写法 |
|---------|------------|-----------|
| 页面背景色 | `bg-[var(--color-bg-page)]` | `bg-background` 或 `bg-page` |
| 卡片背景色 | `bg-[var(--color-bg-card)]` | `bg-card` 或 `bg-surface` |
| 主文字色 | `text-[var(--color-text-primary)]` | `text-foreground` 或 `text-fg` |
| 次要文字色 | `text-[var(--color-text-secondary)]` | `text-muted-foreground` 或 `text-fg-muted` |
| 三级文字色 | `text-[var(--color-text-tertiary)]` | `text-fg-subtle` |
| 默认边框色 | `border-[var(--color-border-default)]` | `border-border` 或 `border-line` |
| 错误色文字 | `text-[var(--color-error)]` | `text-destructive` 或 `text-error` |
| 品牌主色按钮 | `bg-[var(--color-primary)]` | `bg-primary` 或 `bg-action` |
| 品牌主色 hover | `bg-[var(--color-primary-hover)]` | `hover:bg-primary/90` 或 `hover:bg-action-hover` |

### 步骤 4：如果 Token 中确实没有你需要的值

只有在 Token 体系中**经过确认不存在**时，才允许使用 Tailwind 任意值：

```tsx
// ✅ 允许：精确尺寸（Token 间距体系覆盖不到的特殊定位）
<div className="w-[320px] top-[72px]" />

// ✅ 允许：calc 计算值
<div className="min-h-[calc(100vh-64px)]" />

// ✅ 允许：渐变背景中的特定色标
<div className="bg-gradient-to-br from-violet-500 to-indigo-600" />

// ❌ 禁止：Token 已覆盖的颜色/字体等样式用任意值重写
<div className="text-[#333333]" />     // → 用 text-foreground 或 text-fg
<div className="bg-[#ffffff]" />       // → 用 bg-background 或 bg-card
<div className="text-[14px]" />        // → 用 text-sm 或 text-base
```

### 步骤 5：如果确实需要新增 Token

当且仅当设计稿中出现了全新的、复用频率高的样式值时，在对应的 Token 文件中新增变量：

1. 在 `src/styles/tokens/` 对应文件中新增 CSS 变量
2. 如需要 Tailwind class 访问，在 `src/styles/index.css` 的 `@theme` 块中注册
3. 在 PR 中说明新增原因
4. **禁止在页面文件中直接新增 `<style>` 块或内联 `style` 属性**

---

## 三、详细规则

### 3.1 颜色规则

**所有颜色必须使用语义 class，不直接引用 CSS 变量或十六进制色值。**

#### 可用颜色 class 全集

**shadcn 体系（优先用于组件内部）：**

| class | 映射 |
|-------|------|
| `bg-background` / `text-foreground` | 页面背景 / 主文字 |
| `bg-card` / `text-card-foreground` | 卡片背景 / 卡片文字 |
| `bg-popover` / `text-popover-foreground` | 弹层背景 / 弹层文字 |
| `bg-primary` / `text-primary-foreground` | 主色背景 / 主色上文字 |
| `bg-secondary` / `text-secondary-foreground` | 次色背景 / 次色上文字 |
| `bg-muted` / `text-muted-foreground` | 静音背景 / 次要文字 |
| `bg-accent` / `text-accent-foreground` | 强调背景 / 强调文字 |
| `bg-destructive` / `text-destructive` | 危险/错误色 |
| `border-border` | 默认边框 |
| `border-input` | 输入框边框 |
| `ring-ring` | 聚焦环 |

**项目别名体系（优先用于业务页面）：**

| class | 映射 |
|-------|------|
| `bg-page` | `--color-bg-page` |
| `bg-surface` / `bg-elevated` | `--color-bg-card` / `--color-bg-elevated` |
| `bg-surface-hover` / `bg-surface-muted` | `--color-bg-hover` / `--color-bg-muted` |
| `text-fg` / `text-fg-muted` / `text-fg-subtle` | 主文字 / 次要文字 / 三级文字 |
| `text-fg-disabled` / `text-fg-inverse` | 禁用文字 / 反色文字 |
| `border-line` / `border-line-hover` / `border-line-focus` | 默认边框 / hover边框 / 聚焦边框 |
| `bg-action` / `bg-action-hover` | 主操作色 / 主操作 hover |
| `text-success` / `text-warning` / `text-error` | 成功 / 警告 / 错误 |

**品牌色阶梯（按需使用）：**

| class |
|-------|
| `bg-brand-50` / `text-brand-50` |
| `bg-brand-100` / … |
| `bg-brand-500` / `bg-brand-600` / `bg-brand-900` |

#### 颜色使用示例

```tsx
// ✅ 正确
<div className="bg-background text-foreground">
  <div className="bg-card border border-border rounded-lg p-4">
    <h2 className="text-fg text-lg font-semibold">标题</h2>
    <p className="text-fg-muted text-sm">描述</p>
    <button className="bg-primary text-primary-foreground hover:bg-primary/90">确定</button>
    <span className="text-success text-xs">成功</span>
  </div>
</div>

// ❌ 违规
<div className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
  <div className="bg-[#ffffff] border-[#e2e8f0]">
    <h2 style={{ color: '#0f172a' }}>标题</h2>
  </div>
</div>
```

### 3.2 间距规则

**统一使用 4px 基准网格。使用 Tailwind 标准间距 class（映射到 `--space-*` token）。**

| Tailwind class | 对应值 | 对应 token |
|---------------|--------|-----------|
| `p-0` / `m-0` | 0px | `--space-0` |
| `p-0.5` / `gap-0.5` | 2px | `--space-0.5` |
| `p-1` / `gap-1` | 4px | `--space-1` |
| `p-1.5` / `gap-1.5` | 6px | `--space-1.5` |
| `p-2` / `gap-2` | 8px | `--space-2` |
| `p-2.5` / `gap-2.5` | 10px | `--space-2.5` |
| `p-3` / `gap-3` | 12px | `--space-3` |
| `p-4` / `gap-4` | 16px | `--space-4` |
| `p-5` / `gap-5` | 20px | `--space-5` |
| `p-6` / `gap-6` | 24px | `--space-6` |
| `p-8` / `gap-8` | 32px | `--space-8` |
| `p-10` / `gap-10` | 40px | `--space-10` |
| `p-12` / `gap-12` | 48px | `--space-12` |

**不允许使用非 4px 倍数的间距（如 `p-[13px]`、`gap-[7px]`）。** 如设计稿出现非标间距，向上/向下取整到最近的 `--space-*` 值。

```tsx
// ✅ 正确
<div className="p-4 gap-3" />         // 16px / 12px
<div className="px-6 py-3" />         // 水平 24px，垂直 12px

// ❌ 违规
<div className="p-[13px] gap-[7px]" />
```

### 3.3 任意值规则（限白名单）

**以下场景允许使用 Tailwind 任意值 `[value]` 语法：**

| 场景 | 示例 | 说明 |
|------|------|------|
| 精确宽高 | `w-[320px]`, `h-[180px]`, `max-w-[860px]` | Token 间距体系不限制宽高 |
| 定位偏移 | `top-[72px]`, `left-[20px]` | 设计稿精确定位 |
| calc 表达式 | `min-h-[calc(100vh-64px)]` | 动态计算 |
| 特殊圆角 | `rounded-[10px]` | 超出 `--radius-*` 范围的精确值 |
| 渐变中的色标 | `from-[#2d2d7a]` | 渐变背景属于视觉设计，不适用语义色 |
| z-index | `z-[100]` | 层级管理 |

**以下场景禁止任意值：**

| 禁止 | 替代方案 |
|------|---------|
| 颜色任意值（如 `text-[#333]`） | 用语义 class：`text-foreground` / `text-fg` / … |
| 字号任意值（如 `text-[15px]`） | 用 Token class：`text-xs` / `text-sm` / `text-base` / … |
| 间距任意值（如 `p-[13px]`） | 取整到最近的 `--space-*` |
| 阴影任意值（如 `shadow-[0_2px_8px_rgba(0,0,0,0.1)]`） | 用 `shadow-sm` / `shadow-md` / `shadow-lg` / … |
| 边框任意值 | 用 `border` / `border-2` + 语义色 |

### 3.4 布局宽高规则（强制响应式）

**核心原则：所有布局容器不得写死宽高。大屏和小屏均须正常展示。** 仅小图片、小图标、Badge 等非布局元素可写死尺寸。

#### 3.4.1 被禁止的写法

以下在**布局容器**上写死宽高的写法一律禁止：

| ❌ 禁止写法 | 问题 | 出现位置举例 |
|-----------|------|-------------|
| `<aside className="w-56">` | 侧边栏固定 224px，小屏挤占内容区 | Sidebar |
| `<div className="w-80">` | 通知面板固定 320px，手机屏超出 | Header 通知 |
| `<aside className="w-[360px]">` | 配置面板固定 360px，窄屏遮挡画布 | NodeConfigPanel |
| `<div className="w-72">` | 节点侧栏固定 288px | NodeSidebar |
| `<div className="w-[220px]">` | 节点卡片固定 220px | WorkflowNode |
| `<input className="w-56">` | 搜索框固定宽度 | Header 搜索 |
| `<div className="h-[420px]">` | 内容区固定高度，小屏出现双滚动条 | — |
| `<div className="w-[640px]">` | 内容区固定宽度，溢出或留白 | — |
| `<div className="min-w-[800px]">` | 最小宽度过大，小屏直接溢出 | — |

#### 3.4.2 允许写死的例外

**只有以下小型装饰/标识元素允许使用固定宽高：**

| ✅ 允许 | 原因 | 示例 |
|--------|------|------|
| 小图标容器 | `h-6 w-6` ~ `h-10 w-10` | Logo、操作按钮图标、Avatar |
| 小圆点/状态指示 | `h-1.5 w-1.5`、`h-2 w-2` | 在线状态点、通知红点 |
| Badge/徽标 | `min-w-[20px] h-5` | 未读数角标 |
| 小分割线/装饰线 | `h-[1px] w-full` | 分割线（宽度是 full，高度固定） |
| Skeleton 占位 | `h-8 w-48`、`h-64 w-full` | 骨架屏加载态 |
| 小色块/色板 | `h-3 w-3` ~ `h-6 w-6` | 图例色块 |
| 字体图标 (lucide) | `size={14}` ~ `size={20}` | 图标本身不参与布局流 |
| 工具栏按钮 | `h-7 w-11` | 固定尺寸的工具按钮 |

**判断标准：** 如果一个元素的尺寸变化会影响周围内容的排列或页面的整体布局 → 它就是布局容器，不得写死。只有纯装饰性的、不参与内容排列的元素才可以写死。

#### 3.4.3 正确的响应式写法

**布局容器使用弹性/比例/响应式方案：**

```tsx
// ===== 侧边栏：响应式折叠 =====
// ❌ 禁止
<aside className="w-56">侧边栏</aside>

// ✅ 正确 — 使用响应式断点 + 可折叠
<aside className="w-56 lg:w-64 xl:w-72 hidden md:block">
  侧边栏（小屏隐藏，中屏 224px，大屏 256px，超大屏 288px）
</aside>

// ===== 内容区：弹性填充 =====
// ❌ 禁止
<div className="w-[640px]">内容</div>

// ✅ 正确 — flex 弹性 + 最大宽度约束
<div className="flex-1 min-w-0 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
  内容区（自动填充剩余空间，大屏居中，小屏满宽）
</div>

// ===== 卡片列表：Grid 自适应 =====
// ❌ 禁止
<div className="grid grid-cols-3 gap-4 w-[960px]">卡片列表</div>

// ✅ 正确 — 响应式 Grid
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  卡片列表（手机 1 列 → 平板 2 列 → 桌面 3 列 → 大屏 4 列）
</div>

// ===== 弹窗/面板：比例宽度 + 最大约束 =====
// ❌ 禁止
<aside className="w-[360px]">配置面板</aside>

// ✅ 正确 — vw 比例 + max-w 约束
<aside className="w-[min(360px,90vw)] lg:w-[min(400px,33vw)]">
  配置面板（小屏最多 90vw，大屏固定 360px 或 33vw）
</aside>

// ===== 搜索框：弹性宽度 =====
// ❌ 禁止
<input className="w-56" placeholder="搜索" />

// ✅ 正确 — 响应式宽度
<input className="w-full max-w-xs sm:max-w-sm lg:max-w-md" placeholder="搜索" />

// ===== 页面主内容区 =====
// ❌ 禁止
<main className="w-[1200px] mx-auto">内容</main>

// ✅ 正确
<main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  内容（全宽但有限制最大宽度，内边距响应式）
</main>

// ===== 表格区域 =====
// ❌ 禁止
<div className="w-[1100px] overflow-x-auto">
  <table>…</table>
</div>

// ✅ 正确 — 容器自适应 + 横向滚动兜底
<div className="w-full overflow-x-auto">
  <table className="min-w-full lg:min-w-[800px]">…</table>
</div>
```

#### 3.4.4 响应式断点速查

| 断点前缀 | 最小宽度 | 设备 |
|---------|---------|------|
| (无前缀) | 0px | 手机 |
| `sm:` | 640px | 大手机/小平板 |
| `md:` | 768px | 平板 |
| `lg:` | 1024px | 笔记本 |
| `xl:` | 1280px | 桌面 |
| `2xl:` | 1536px | 大屏桌面 |

#### 3.4.5 常用响应式组合模式

```tsx
// ----- 模式 1：弹性内容区 -----
<div className="flex-1 min-w-0 overflow-y-auto">
  {/* min-w-0 防止 flex 子项被内容撑开不收缩 */}
  {/* overflow-y-auto 保证内容区独立滚动 */}
</div>

// ----- 模式 2：响应式网格卡片 -----
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* 自动适配列数 */}
</div>

// ----- 模式 3：响应式两栏布局 -----
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 xl:w-72 shrink-0">侧栏</aside>
  <main className="flex-1 min-w-0">主内容</main>
</div>

// ----- 模式 4：受限内容宽度 -----
<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* 内容居中，大屏有最大宽度限制 */}
</div>

// ----- 模式 5：全高布局 -----
<div className="flex h-screen overflow-hidden">
  <aside className="w-56 lg:w-64 shrink-0 hidden md:block border-r">导航</aside>
  <div className="flex-1 flex flex-col min-w-0 min-h-0">
    <header className="shrink-0 h-14 border-b">顶栏</header>
    <main className="flex-1 overflow-y-auto">内容</main>
  </div>
</div>

// ----- 模式 6：侧边面板（抽屉式）-----
<aside className={cn(
  'absolute top-0 bottom-0 right-0 z-20 border-l bg-card shadow-xl transition-all',
  isOpen ? 'w-[min(360px,90vw)]' : 'w-0 overflow-hidden',
)}>
  面板内容
</aside>
```

### 3.5 字号规则

**只使用 Token 定义的字号阶梯：**

| class | 值 | 用途 |
|-------|----|------|
| `text-2xs` | 10px | 极小标签、角标 |
| `text-xs` | 12px | 辅助文字、caption |
| `text-sm` | 14px | 正文（默认）、列表 |
| `text-base` | 14px | 正文基准（同 sm） |
| `text-lg` | 16px | 小标题、强调正文 |
| `text-xl` | 18px | H3 |
| `text-2xl` | 20px | H2 |
| `text-3xl` | 24px | H1（页面级） |
| `text-4xl` | 30px | 大标题（登录页等） |

**字重 class：**
- `font-normal` (400) — 正文
- `font-medium` (500) — 常用强调
- `font-semibold` (600) — 标题、按钮
- `font-bold` (700) — 强强调

```tsx
// ✅ 正确
<h1 className="text-2xl font-semibold">页面标题</h1>
<p className="text-sm text-fg-muted">描述文本</p>
<span className="text-xs text-fg-subtle">辅助信息</span>

// ❌ 违规
<h1 className="text-[22px] font-[650]">页面标题</h1>
```

### 3.6 圆角规则

| class | 值 | 用途 |
|-------|----|------|
| `rounded-none` | 0 | 无圆角 |
| `rounded-sm` | 4px | 小元素 |
| `rounded-md` | 8px | 按钮、输入框、标签 |
| `rounded-lg` | 12px | 卡片、面板 |
| `rounded-xl` | 16px | 大型卡片 |
| `rounded-2xl` | 24px | 弹窗、Modal |
| `rounded-full` | 9999px | 胶囊、头像 |

### 3.7 阴影规则

| class | 用途 |
|-------|------|
| `shadow-xs` | 微妙分层 |
| `shadow-sm` | 卡片默认（亮色） |
| `shadow-md` | 卡片悬浮（亮色）/ 卡片默认（暗色） |
| `shadow-lg` | 下拉菜单、悬浮按钮 |
| `shadow-xl` | 弹窗、Modal |

```tsx
// ✅ 正确
<div className="rounded-xl bg-card border border-border shadow-sm">卡片</div>

// ❌ 违规
<div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>卡片</div>
```

### 3.8 内联 style 属性 — 零容忍

ESLint 已配置禁止 `style` 属性的规则（[eslint.config.js](../eslint.config.js) `no-restricted-syntax`），以下写法会在 lint 阶段直接报错：

```tsx
// ❌ ESLint error — 禁止内联 style
<div style={{ color: 'red' }} />
<div style={{ padding: 16 }} />
```

### 3.9 页面级 CSS 文件

**禁止在页面目录下新增 `.css` / `.module.css` 文件。** 唯一的例外是第三方库样式覆盖（如 [workflow.css](../src/features/workflows/workflow.css) 覆盖 React Flow 默认样式），且必须：

1. 写在对应 feature 目录下（非全局 `styles/`）
2. 使用项目 Token 变量（`var(--color-*)`），不写死十六进制色值
3. 添加 `stylelint-disable` 注释（如覆盖第三方 class name pattern）
4. 在 PR 中说明为何不能用 Tailwind class 实现

---

## 四、页面开发 Checklist

每开发一个新页面，必须逐项检查：

- [ ] 所有颜色使用了语义 class（`bg-background` / `text-foreground` / `text-fg-muted` 等），无 `var(--color-*)` 直接引用
- [ ] 所有间距使用了 Tailwind 标准间距 class（`p-1` ~ `p-12`），无 `p-[13px]` 等非标值
- [ ] 所有字号使用了 Token 阶梯 class（`text-xs` ~ `text-4xl`），无 `text-[15px]`
- [ ] 所有圆角使用了 `rounded-sm` ~ `rounded-2xl`，无 `rounded-[7px]`（除非确实超出 `rounded-xl` 的 16px 上限）
- [ ] 所有阴影使用了 `shadow-xs` ~ `shadow-xl`
- [ ] 无内联 `style` 属性（ESLint 已拦截）
- [ ] 无页面级新增 `.css` 文件（第三方库覆盖除外，见 §3.8）
- [ ] 所有布局容器无写死宽高（`w-56`、`w-[360px]`、`h-[420px]` 等），使用弹性/比例/响应式方案（见 §3.4）
- [ ] 写死的尺寸仅用于小型装饰/标识元素（图标、Badge、状态点等）（见 §3.4.2）
- [ ] 页面使用了响应式断点（`sm:` / `md:` / `lg:` / `xl:`）适配不同屏幕（见 §3.4.4）
- [ ] 任意值 `[value]` 仅在白名单场景使用（见 §3.3）
- [ ] 渐变背景中的色标使用了合理的 hex 值或 `var(--color-*)`（渐变是唯一允许 hex 的场景）
- [ ] 页面通过 `pnpm lint` 和 `pnpm stylelint` 检查

---

## 五、代码审查要点

审查者在 review 样式代码时，重点关注：

1. **是否出现写死宽高的布局容器** — `w-56`、`w-[360px]`、`h-[420px]` 等必须改为响应式方案
2. **是否出现 `var(--color-*)` 在 className 中** — 必须替换为语义 class
3. **是否出现 `style={{}}`** — ESLint 已拦截，但仍需人工确认
4. **是否出现非标间距值** — 检查 `[` 任意值中是否有 `px` 单位的间距
5. **是否新增了页面级 CSS 文件** — 除第三方覆盖外一律拒绝
6. **新增 Token 是否有充分理由** — 需在 PR 描述中说明
7. **是否所有布局都有响应式处理** — 小屏（<640px）和大屏（>1280px）均应正常展示

---

## 六、违规处理

| 违规级别 | 示例 | 处理方式 |
|---------|------|---------|
| **阻断** | 内联 `style`、新增页面 CSS 文件、布局容器写死宽高无响应式 | 合并前必须修复 |
| **严重** | 用 `var(--color-*)` 代替语义 class | 合并前必须修复 |
| **警告** | 非标间距任意值 | 建议修复，如有合理理由可说明 |

---

## 七、参考：已有违规代码（待修复）

以下文件存在不符合本规范的写法，将在后续版本中修复：

| 文件 | 问题 | 计划修复 |
|------|------|---------|
| [Sidebar.tsx](../src/components/layout/Sidebar.tsx) | `w-56` 写死侧边栏宽度，无响应式处理 | 阶段 B 前 |
| [Header.tsx](../src/components/layout/Header.tsx) | 搜索框 `w-56`、通知面板 `w-80` 固定宽 | 阶段 B 前 |
| [WorkflowNode.tsx](../src/features/workflows/components/WorkflowNode.tsx) | 节点卡片 `w-[220px]` 固定宽 | 阶段 B 前 |
| [NodeConfigPanel.tsx](../src/features/workflows/components/NodeConfigPanel.tsx) | 配置面板 `w-[360px]` 固定宽，无小屏适配 | 阶段 B 前 |
| [NodeSidebar.tsx](../src/features/workflows/components/NodeSidebar.tsx) | `w-72` 固定宽，无响应式处理 | 阶段 B 前 |
| [LoginPage.tsx](../src/features/auth/LoginPage.tsx) | 大量 `var(--color-*)` 直接引用 | 阶段 B 前 |
| [UsersPage.tsx](../src/features/users/UsersPage.tsx) | `text-[var(--color-text-secondary)]` | 阶段 B 前 |
| [SettingsPage.tsx](../src/features/settings/SettingsPage.tsx) | `text-[var(--color-text-secondary)]` | 阶段 B 前 |
| [ReactQueryDemo.tsx](../src/features/components/demos/ReactQueryDemo.tsx) | 多处 `var(--color-*)` 直接引用 | 阶段 B 前 |

---

## 八、快速参考卡片

```
┌──────────────────────────────────────────────────────────────┐
│                      样式选择决策树                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  需要颜色？ → shadcn体系(bg-primary/text-foreground/…)       │
│            → 或项目别名(bg-page/text-fg/border-line/…)       │
│                                                              │
│  需要间距？ → Tailwind标准: p-{0..12} / gap-{0..12}         │
│                                                              │
│  需要字号？ → Token阶梯: text-{2xs..4xl}                     │
│                                                              │
│  需要圆角？ → Token阶梯: rounded-{sm..2xl}                   │
│                                                              │
│  需要阴影？ → Token阶梯: shadow-{xs..xl}                     │
│                                                              │
│  需要布局宽高？ → flex-1 / min-w-0 / w-full / % / vw / vh   │
│                → 响应式: sm: / md: / lg: / xl:               │
│                → 最大约束: max-w-{xs..7xl}                   │
│                → 小固定尺寸仅限 icon/badge/dot (≤40px)       │
│                                                              │
│  需要特殊尺寸？ → 任意值: w-[320px]（仅非布局元素）          │
│                                                              │
│  需要渐变背景？ → 允许 hex: from-violet-500 to-blue-600      │
│                                                              │
│  ⚠ 以上都不满足？ → 在 src/styles/tokens/ 新增变量          │
│                                                              │
│  ❌ 禁止: style={{}} / var(--color-*) / 非标间距 /           │
│          页面级 .css 文件 / 布局容器写死宽高                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 九、外部项目迁移规范

> **适用场景**：将其他项目（非 AI Flow Admin）的页面/模块迁移到当前项目时，必须遵循以下流程和规则。

### 9.1 迁移总则

**一句话：保留原项目的业务逻辑和信息架构，但组件和样式 100% 替换为当前项目方案。**

| 保留（从原项目） | 替换为（当前项目） |
|----------------|------------------|
| 页面信息架构、布局骨架 | 当前项目布局组件：`MainLayout`、`Sidebar`、`Header` |
| 业务逻辑、数据流 | 当前项目数据流：`api/` → `hooks/` → `features/` |
| 表单字段定义、校验规则 | 当前项目表单方案：`react-hook-form` + `zod` + `Form` 组件 |
| 文案、交互流程 | — |

| 必须替换 | 替换目标 |
|---------|---------|
| 原项目所有组件 | → `src/components/ui/` 下对应组件（见 §9.2 映射表） |
| 原项目所有 CSS/less/scss | → Tailwind 语义 class（遵循本规范 §3） |
| 原项目内联 style | → Tailwind class（ESLint 强制执行） |
| 原项目的固定宽高布局 | → 响应式弹性布局（遵循本规范 §3.4） |
| 原项目的 hex 色值 | → 语义 class（如 `text-foreground`、`bg-primary`） |
| 原项目的自定义图标组件 | → `lucide-react` 图标 |
| 原项目的 toast/notification | → `sonner` toast |
| 原项目的 modal/dialog | → `Dialog` / `Sheet`（`src/components/ui/`） |
| 原项目的表格 | → `DataTable`（`src/components/ui/data-table.tsx`） |
| 原项目的下拉菜单 | → `DropdownMenu`（`src/components/ui/`） |

### 9.2 UI 组件迁移映射表

迁移时，将原项目的组件替换为 `src/components/ui/` 下对应的 shadcn 组件：

| 原项目组件类型 | 当前项目组件 | 路径 |
|--------------|------------|------|
| Button | `Button` | `@/components/ui/button` |
| Input / TextField | `Input` | `@/components/ui/input` |
| Textarea | `Textarea` | `@/components/ui/textarea` |
| Select / Dropdown | `Select` | `@/components/ui/select` |
| MultiSelect / TagSelect | `MultiSelect` | `@/components/ui/multi-select` |
| Checkbox | `Checkbox` | `@/components/ui/checkbox` |
| Switch / Toggle | `Switch` | `@/components/ui/switch` |
| RadioGroup | `RadioGroup` | `@/components/ui/radio-group` |
| Card / Panel | `Card` | `@/components/ui/card` |
| Dialog / Modal | `Dialog` | `@/components/ui/dialog` |
| Sheet / Drawer / SlidePanel | `Sheet` | `@/components/ui/sheet` |
| Dropdown / ContextMenu | `DropdownMenu` | `@/components/ui/dropdown-menu` |
| Tooltip | `Tooltip` | `@/components/ui/tooltip` |
| Popover | `Popover` | `@/components/ui/popover` |
| Tabs | `Tabs` | `@/components/ui/tabs` |
| Accordion / Collapse | `Accordion` | `@/components/ui/accordion` |
| Badge / Tag / Label | `Badge` | `@/components/ui/badge` |
| Avatar / UserIcon | `Avatar` | `@/components/ui/avatar` |
| Alert / Banner / Message | `Alert` | `@/components/ui/alert` |
| Progress / LoadingBar | `Progress` | `@/components/ui/progress` |
| Skeleton / Loading | `Skeleton` | `@/components/ui/skeleton` |
| Slider / Range | `Slider` | `@/components/ui/slider` |
| Calendar | `Calendar` | `@/components/ui/calendar` |
| DatePicker | `DatePicker` | `@/components/ui/date-picker` |
| TimePicker | `TimePicker` | `@/components/ui/time-picker` |
| Table / DataGrid | `DataTable` | `@/components/ui/data-table` |
| Table (基础) | `Table` | `@/components/ui/table` |
| Form | `Form` | `@/components/ui/form` |
| ScrollArea | `ScrollArea` | `@/components/ui/scroll-area` |
| Separator / Divider | `Separator` | `@/components/ui/separator` |
| Toast | `sonner` / `toast` | `sonner` 库 / `@/lib/toast` |
| 图标 | `lucide-react` | 从 `lucide-react` 按需导入 |

### 9.3 迁移执行步骤（严格按序）

```
步骤 1：分析原页面 → 拆解 UI 元素清单
  ├── 列出所有组件类型（Button/Input/Select/Table/…）
  ├── 列出所有颜色值（背景、文字、边框、状态色）
  ├── 列出所有布局结构（flex/grid、固定宽高、间距）
  └── 列出所有交互状态（hover/active/disabled/loading/error/empty）

步骤 2：在 src/components/ui/ 中找到对应组件
  ├── 参考组件 Demo 页（/components/*）了解用法
  ├── 确认组件 props 和 variants 是否满足需求
  └── 不满足时优先封装组合组件，而非修改 ui 组件

步骤 3：在 src/styles/ 中查找语义 class 映射
  ├── 对照本规范 §3.1 的 class 速查表
  ├── 将原项目的每个 hex 色值映射到语义 class
  └── 将原项目的间距值对齐到 4px 网格

步骤 4：在 shadcn-tailwind-使用文档.md 中查找写法
  ├── 参考文档中的代码模板
  └── 套用页面骨架示例

步骤 5：编写代码
  ├── 文件按照 types → api → hooks → features 分层放置
  ├── 组件全部来自 src/components/ui/
  ├── 样式全部使用 Tailwind 语义 class
  ├── 布局全部使用响应式方案（§3.4）
  └── 不新增任何 CSS 文件

步骤 6：对照 Checklist（§4）逐项检查
  └── 通过 pnpm lint / pnpm stylelint / pnpm type-check
```

### 9.4 样式迁移速查指南

将原项目的常见样式快速映射为当前项目的 Tailwind class：

#### 背景色迁移

| 原项目样式 | 当前项目 class |
|-----------|---------------|
| `background: #fff` / `background: white` | `bg-card` 或 `bg-surface` |
| `background: #f8fafc` / `background: #f5f5f5` | `bg-background` 或 `bg-page` |
| `background: #f1f5f9` | `bg-muted` 或 `bg-surface-muted` |
| 主色背景（蓝色系） | `bg-primary` |
| 主色背景 hover | `hover:bg-primary/90` |
| 灰色背景 hover | `hover:bg-accent` 或 `hover:bg-surface-hover` |

#### 文字色迁移

| 原项目样式 | 当前项目 class |
|-----------|---------------|
| `color: #0f172a` / `color: #111` | `text-foreground` 或 `text-fg` |
| `color: #64748b` / `color: #666` | `text-muted-foreground` 或 `text-fg-muted` |
| `color: #94a3b8` / `color: #999` | `text-fg-subtle` |
| `color: #ef4444`（红色/错误） | `text-destructive` 或 `text-error` |
| `color: #22c55e`（绿色/成功） | `text-success` |
| `color: #f59e0b`（黄色/警告） | `text-warning` |
| `color: #2563eb`（蓝色/链接） | `text-primary` |

#### 边框色迁移

| 原项目样式 | 当前项目 class |
|-----------|---------------|
| `border: 1px solid #e2e8f0` | `border border-border` 或 `border border-line` |
| `border: 1px solid #cbd5e1` | `border border-line-hover` |
| `border-bottom: 1px solid #e2e8f0` | `border-b border-border` |
| 分割线 | `divide-y divide-line`（父容器）或 `<Separator />` |

#### 间距迁移

| 原项目样式 | 当前项目 class |
|-----------|---------------|
| `padding: 4px` | `p-1` |
| `padding: 8px` | `p-2` |
| `padding: 12px` | `p-3` |
| `padding: 16px` | `p-4` |
| `padding: 20px` | `p-5` |
| `padding: 24px` | `p-6` |
| `padding: 32px` | `p-8` |
| `margin: 16px` | `m-4` |
| `gap: 12px` | `gap-3` |
| `gap: 16px` | `gap-4` |

#### 圆角迁移

| 原项目样式 | 当前项目 class |
|-----------|---------------|
| `border-radius: 4px` | `rounded-sm` |
| `border-radius: 8px` | `rounded-md` |
| `border-radius: 12px` | `rounded-lg` |
| `border-radius: 16px` | `rounded-xl` |
| `border-radius: 999px` | `rounded-full` |

#### 宽高迁移（布局容器 ❌→✅）

| 原项目样式 | ❌ 禁止直接翻译 | ✅ 正确改写 |
|-----------|---------------|-----------|
| `width: 224px`（侧边栏） | `w-56` | `w-56 lg:w-64 xl:w-72 hidden md:block` |
| `width: 320px`（面板） | `w-80` | `w-[min(320px,90vw)]` |
| `width: 360px`（抽屉） | `w-[360px]` | `w-[min(360px,90vw)] lg:w-[min(400px,33vw)]` |
| `width: 1200px`（主内容区） | `w-[1200px]` | `w-full max-w-7xl mx-auto` |
| `width: 100%` | `w-full`（正确，保持不变） | — |
| `height: 100vh` | `h-screen`（正确，保持不变） | — |
| `height: 420px` | `h-[420px]`（禁止） | `min-h-0 flex-1`（弹性的）或 `h-full` |

### 9.5 组件用法快速入口

当前项目 `src/components/ui/` 下所有组件均有 Demo 页面，可直接预览效果和代码：

1. 启动项目：`pnpm dev`
2. 访问 `/components` → 选择具体组件查看 Demo
3. Demo 源码位置：`src/features/components/demos/`

**常用组件快速参考：**

```tsx
// ===== 按钮 =====
import { Button } from '@/components/ui/button';
<Button>默认</Button>
<Button variant="secondary">次要</Button>
<Button variant="outline">描边</Button>
<Button variant="ghost">幽灵</Button>
<Button variant="destructive">危险</Button>
<Button size="sm">小号</Button>
<Button size="icon-sm"><Settings size={14} /></Button>

// ===== 输入框 =====
import { Input } from '@/components/ui/input';
<Input placeholder="请输入" />
<Input type="search" className="pl-9" /> {/* 配合图标使用 */}

// ===== 下拉选择 =====
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
<Select>
  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">选项 A</SelectItem>
    <SelectItem value="b">选项 B</SelectItem>
  </SelectContent>
</Select>

// ===== 弹窗 =====
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
<Dialog>
  <DialogTrigger asChild><Button>打开</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>标题</DialogTitle></DialogHeader>
    {/* 内容 */}
  </DialogContent>
</Dialog>

// ===== 表单 =====
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
<Form {...form}>
  <FormField control={form.control} name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel>名称</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>

// ===== 表格 =====
import { DataTable } from '@/components/ui/data-table';
// 参考 src/features/components/demos/TableDemo.tsx

// ===== 数据请求 =====
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// 参考 src/hooks/useUsers.ts 的 query key 结构和 mutation 模式

// ===== Toast 提示 =====
import { toast } from 'sonner';
toast.success('操作成功');
toast.error('操作失败');
```

### 9.6 常见迁移陷阱

| 陷阱 | 说明 | 正确做法 |
|------|------|---------|
| 直接把原项目 CSS 文件放到新项目 | 样式体系完全不同 | 按照 §9.3 步骤映射到 Tailwind class |
| 原项目用 `antd`/`element-ui` 等组件库 | 组件 API 完全不同 | 全部替换为 `src/components/ui/` 组件 |
| 原项目用 CSS Modules | 组件和样式强耦合 | 组件改用 shadcn/ui，样式改用 Tailwind class |
| 原项目写死 `width: 1200px` | 当前项目要求响应式 | 改为 `w-full max-w-7xl` + 响应式 padding |
| 原项目自定义图标 | 图标库不同 | 从 `lucide-react` 找等价图标替换 |
| 原项目 toast/message 组件 | 当前项目用 sonner | 替换为 `toast.success()` / `toast.error()` |
| 原项目自定义表格 | 当前项目有 DataTable | 使用 `DataTable`，配置列定义即可 |
| 忽略空状态/加载态/错误态 | 原项目可能只写了正常态 | 必须补全：`isLoading` → Skeleton、`isEmpty` → 空状态、`isError` → 错误提示 |

