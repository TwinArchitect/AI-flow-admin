# AI Flow Admin — 页面迁移编写规范

> 适用场景：将原型项目（或任何外部项目）的页面迁移到当前项目时，必须遵循本规范。
>
> 核心理念：**不改视觉，只换实现**。保持原型布局和设计效果，但用当前项目的组件、样式体系、工具函数来承载。
>
> 配套文档：
> - [STYLE_SPEC.md](STYLE_SPEC.md) — 样式开发规范（颜色/间距/字号/圆角/阴影/响应式）
> - [shadcn-tailwind-使用文档.md](../shadcn-tailwind-使用文档.md) — Tailwind + shadcn 写法速查

---

## 一、核心原则（4 条铁律）

```
1. 不用色值 → 语义 class 替代 hex/#/rgb
2. 不手写组件 → 优先复用 src/components/ui/
3. 不用模板字符串拼 class → 一律用 cn()
4. 不把数据写组件里 → 抽到 data.ts
```

---

## 二、颜色铁律（最重要）

### 2.1 普通业务区域：零色值

**绝对禁止出现 hex、rgb、固定色板值。** 全部使用语义 class：

| 用途 | ❌ 禁止 | ✅ 使用 |
|------|--------|--------|
| 页面/卡片背景 | `bg-white` `bg-[#fff]` `bg-slate-50` | `bg-background` `bg-card` `bg-muted` |
| 主文字 | `text-slate-900` `text-[#111]` | `text-foreground` |
| 次要文字 | `text-slate-500` `text-slate-400` | `text-muted-foreground` `text-fg-muted` |
| 辅助/编号文字 | `text-slate-400` | `text-fg-subtle` |
| 边框 | `border-slate-200` `border-slate-100` | `border-border` `border-line` |
| 主操作色 | `text-brand-600` `bg-brand-500` | `text-primary` `bg-primary` |

**对照速查：**

```
原项目色值            →    目标 class
─────────────────────────────────────────
text-slate-900              text-foreground
text-slate-500/400          text-muted-foreground / text-fg-muted
text-slate-400              text-fg-subtle
bg-white                    bg-background / bg-card
bg-slate-50                 bg-muted
border-slate-200            border-border
text-brand-*                text-primary
bg-brand-*                  bg-primary
```

### 2.2 品牌装饰区域：允许例外

**Hero、架构图、品牌展示区等刻意设计的固定视觉区域**，可以保留固定色值（如 `bg-slate-950`、`text-slate-100`、`#312e81` 渐变），不要求机械替换。但：

- 如果出现 hex 硬编码（如 `#312e81`），建议提取为 CSS 变量或 Tailwind 色板值
- 区域边界必须清晰（整个 section 保持同一深色主题），不与普通业务区域混用
- 在代码中添加注释说明该区域为品牌固定视觉区

### 2.3 功能色标识

能力卡片、分类标签等需要颜色区分的场景，使用 Tailwind 内置色板（`text-blue-500`、`bg-emerald-500/10` 等），**不需要**映射到语义 token。这属于信息标识，不是主题色。

---

## 三、组件复用铁律

### 3.1 组件选择决策树

```
页面需要什么？
├── 按钮           → <Button variant="..." size="...">
├── 卡片容器       → <Card> + <CardContent>
├── 标签/徽标      → <Badge variant="...">
├── Tab 切换       → <Tabs> + <TabsList> + <TabsTrigger> + <TabsContent>
├── 弹窗           → <Dialog> / <Sheet>
├── 下拉菜单       → <DropdownMenu>
├── 输入框         → <Input>
├── 文本域         → <Textarea>
├── 下拉选择       → <Select>
├── 提示           → <Tooltip>
├── 折叠面板       → <Accordion>
├── 头像           → <Avatar>
├── 骨架屏         → <Skeleton>
├── 进度条         → <Progress>
├── 表格           → <DataTable>（复杂）/ <Table>（简单）
├── 表单           → <Form> + react-hook-form + zod
└── 以上都不匹配   → 用原生 HTML + Tailwind（不要手写新组件）
```

### 3.2 组件映射速查

| 原型项目写法 | 迁移后写法 |
|------------|----------|
| `<button className="...">` | `<Button variant="..." size="...">` |
| `<div className="card...">` | `<Card>` + `<CardContent>` |
| `<span className="tag...">` | `<Badge variant="secondary">` |
| `<div onClick={切换Tab}>` | `<Tabs>` 组件 |
| 手写 Modal | `<Dialog>` / `<Sheet>` |
| 手写 toast | `toast.success()` (sonner) |

### 3.3 Button 映射规则

```
原项目 button 样式            →   shadcn Button props
─────────────────────────────────────────────────────
bg-brand-500 text-white       →   variant="default"
bg-slate-100 border           →   variant="outline"
透明背景 hover 变灰           →   variant="ghost"
bg-slate-200                  →   variant="secondary"
bg-red-500 text-white         →   variant="destructive"
小按钮（h-6~7）               →   size="xs" 或 size="sm"
纯图标按钮                    →   size="icon-sm"
```

自定义样式（渐变、圆角等）通过 `className` 追加，不覆盖 variant 的行为语义：

```tsx
// ✅ 正确：variant 负责交互语义，className 加视觉定制
<Button variant="default" className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl">
  立即创建
</Button>

// ❌ 错误：绕开 variant，完全自定义
<button className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl ...">
  立即创建
</button>
```

---

## 四、`cn()` 铁律

### 4.1 规则

**所有条件 class 必须用 `cn()` 合并，禁止使用模板字符串拼接。**

```tsx
// ❌ 禁止
className={`rounded-xl text-xs ${active ? 'bg-primary' : 'bg-muted'}`}

// ✅ 正确
import { cn } from '@/lib/utils';
className={cn('rounded-xl text-xs', active ? 'bg-primary' : 'bg-muted')}
```

### 4.2 常见模式

```tsx
// 布尔切换
className={cn('base-class', isActive && 'active-class')}

// 多值选择
className={cn('base-class', variant === 'a' ? 'class-a' : 'class-b')}

// 多条件叠加
className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'opacity-50 pointer-events-none',
  size === 'sm' ? 'text-xs py-1' : 'text-sm py-2',
)}

// 从数据配置中合并
className={cn('inline-flex items-center rounded-full text-xs', item.color)}
```

### 4.3 数据配置中的 class 字符串

静态数据中保存完整 class 可以保留（如 `color: "bg-blue-500/10 text-blue-300"`），但组件消费时用 `cn()` 合并：

```tsx
const tags = [{ label: "AI", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" }];

// ✅ 正确
<span className={cn('text-xs font-bold px-3 py-1 rounded-xl border', item.color)}>
  {item.label}
</span>
```

---

## 五、数据与组件分离

### 5.1 规则

**静态 mock 数据、配置数组必须移出组件函数体，放到组件外部或独立的 `data.ts`。**

```tsx
// ❌ 禁止：数据在组件内，每次渲染重建
export function DashboardPage() {
  const capabilities = [{ id: "01", title: "...", ... }];  // 每次渲染都创建新数组
  return (...
}

// ✅ 正确：数据在组件外，只创建一次
const capabilities = [{ id: "01", title: "...", ... }];

export function DashboardPage() {
  return (...
}
```

### 5.2 拆分时机

| 页面行数 | 处理方式 |
|---------|---------|
| < 200 行 | 数据放在组件外部即可，不拆文件 |
| 200~400 行 | 数据抽到 `data.ts`，页面保持单文件 |
| > 400 行 | 数据抽到 `data.ts`，按视觉区块拆子组件到 `components/` |

---

## 六、组件拆分原则

### 6.1 何时拆分

| 条件 | 处理 |
|------|------|
| 页面 > 400 行 | 按视觉区块拆分 |
| 同一 UI 模式出现 3+ 次 | 抽取为可复用组件 |
| 区块有独立交互状态 | 拆分为独立组件管理自己的 state |
| 区块是品牌固定视觉区（Hero/架构图） | 拆分以隔离其特殊颜色处理 |

### 6.2 拆到什么程度

```
features/{page}/
├── {Page}.tsx                # 页面主文件，组装各 Section
├── {Page}.data.ts            # 静态数据（可选）
└── components/
    ├── {Page}Hero.tsx        # Hero 品牌展示区（保留固定色值）
    ├── {Page}Overview.tsx    # 概述区
    ├── {Page}Capability.tsx  # 能力卡片区
    └── ...
```

### 6.3 拆分底线

- 不改变页面视觉和业务文案
- 不为了拆分引入无意义的抽象层（如 `cva` 用于单一 variant）
- 拆分后每个子组件 < 200 行

---

## 七、Key 规则

**稳定的列表数据必须使用唯一标识作为 key，禁止用数组下标。**

```tsx
// ❌ 禁止
{items.map((item, idx) => <Card key={idx}>...</Card>)}

// ✅ 正确：用 id/label/name/tag 等稳定值
{capabilities.map((cap) => <Card key={cap.id}>...</Card>)}
{tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
{roles.map((role) => <div key={role.name}>...</div>)}
```

---

## 八、迁移执行 Checklist

迁移每个页面时，逐项完成：

### 第一批（必须）

- [ ] 删除所有 hex 色值（`#xxxxxx`），替换为语义 class 或 Tailwind 色板值
- [ ] 普通业务区域 `bg-white` → `bg-background` / `bg-card` / `bg-muted`
- [ ] 普通业务区域 `text-slate-*` → `text-foreground` / `text-muted-foreground` / `text-fg-muted` / `text-fg-subtle`
- [ ] 普通业务区域 `border-slate-*` → `border-border` / `border-line`
- [ ] `text-brand-*` / `bg-brand-*` → `text-primary` / `bg-primary`
- [ ] `<button>` → `<Button>`（匹配 variant + size）
- [ ] 手写 Tab → `<Tabs>` 组件
- [ ] 条件 class 全部改用 `cn()`

### 第二批（建议）

- [ ] 卡片 → `<Card>` + `<CardContent>`
- [ ] 标签 → `<Badge variant="...">`
- [ ] 手写 Modal/Drawer → `<Dialog>` / `<Sheet>`
- [ ] 静态数据移出组件函数
- [ ] 数组下标 key → 稳定唯一 key

### 第三批（优化）

- [ ] 页面 > 400 行 → 按区块拆分组件
- [ ] Hero/品牌固定色区 → 拆分为独立组件 + 注释说明
- [ ] 删除迁移过程中留下的新旧 class 对照注释
- [ ] 亮/暗双模式均验证通过

---

## 九、可以保留的原型写法

以下内容**不需要**为了统一而改动：

1. `flex`、`grid`、响应式断点、间距、尺寸、定位 — 都是标准 Tailwind utility
2. `rounded-[32px]`、`text-[11px]`、`min-h-[180px]` 等任意值 — 明确的页面视觉参数
3. 品牌展示区的固定深色背景 — 刻意设计，不跟随亮/暗切换
4. 彩色渐变（`from-blue-500 to-indigo-600`）— 视觉标识，非主题色
5. 已正确使用的语义 class — `bg-card`、`text-foreground`、`text-muted-foreground` 等

---

## 十、禁止模式清单（来自审计经验）

以下模式在之前的迁移审计中被发现违规，**绝对禁止**在新代码中出现：

### 10.1 手写 shadcn 已有模式

| ❌ 禁止 | ✅ 改为 | 示例位置 |
|--------|---------|---------|
| `state + Button` 手写 Tab 切换 | `<Tabs>` + `<TabsList>` + `<TabsTrigger>` | Dashboard 架构 Tab |
| `<div>` 手写卡片容器（border/rounded/hover） | `<Card>` + `<CardContent>` | Dashboard 能力卡片 |
| `<span>` 标签样式手写 | `<Badge variant="secondary">` | Dashboard 能力标签 |

### 10.2 布局容器写死宽度

| ❌ 禁止 | 问题 |
|--------|------|
| `w-[360px]` 固定面板宽度 | 小屏溢出 |
| `w-56` 固定侧栏宽度 | 窄屏挤压 |
| `max-w-[360px]` 固定容器宽度 | 应使用比例或约束 |

**例外**：仅 `w-6` ~ `w-10` 级别的小图标/Badge/头像容器允许写死（装饰元素）。

### 10.3 字符/文字任意值优先查 token

| 值 | ❌ 禁止 | ✅ 使用 |
|----|--------|--------|
| 10px | `text-[10px]` | `text-2xs`（token 已存在） |
| 14px | `text-[14px]` | `text-sm`（token 已存在） |
| 12px | `text-[12px]` | `text-xs`（token 已存在） |

如果设计稿使用 11px，且 token 体系中无对应值（只有 10px / 12px），**允许保留** `text-[11px]` 作为明确的视觉参数。

---

## 十一、验收标准

- [ ] 页面中**无 hex 色值**（`#xxxxxx`）
- [ ] 普通业务区域**无 `bg-white`、`text-slate-*`、`border-slate-*`**
- [ ] Hero/品牌区深色视觉**保持不变**
- [ ] 交互组件使用**项目现有 shadcn 组件**
- [ ] 条件 class 全部使用 **`cn()`**
- [ ] 列表 key 使用**稳定标识**
- [ ] 静态数据在**组件外部**
- [ ] 亮色/暗色模式下视觉一致
- [ ] 不引入新的页面级 CSS 文件
- [ ] 通过 `pnpm lint` + `pnpm type-check`
