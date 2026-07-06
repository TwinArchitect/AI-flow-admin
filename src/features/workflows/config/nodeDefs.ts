import {
  Bot,
  BrainCircuit,
  Code2,
  Database,
  GitBranch,
  Globe,
  Layers,
  MessageSquare,
  Play,
  PlugZap,
  Square,
  Zap,
} from 'lucide-react';
import type React from 'react';
import type { WorkflowNodeCategory, WorkflowNodeDef, WorkflowNodeType } from '../types';

export const NODE_CATEGORIES: WorkflowNodeCategory[] = [
  {
    title: '基础',
    items: [
      {
        type: 'llm',
        name: '大模型',
        description: '调用模型生成、理解或推理文本',
        category: '基础',
        tone: 'bg-primary/10 text-primary border-primary/20',
        iconTone: 'bg-primary text-primary-foreground',
      },
      {
        type: 'knowledge',
        name: '知识库',
        description: '检索知识库并返回相关片段',
        category: '基础',
        tone: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
        iconTone: 'bg-sky-500 text-white',
      },
    ],
  },
  {
    title: '工具',
    items: [
      {
        type: 'http',
        name: 'HTTP 请求',
        description: '调用外部接口获取数据',
        category: '工具',
        tone: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
        iconTone: 'bg-blue-500 text-white',
      },
      {
        type: 'reply',
        name: '指定回复',
        description: '输出固定文本或变量内容',
        category: '工具',
        tone: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
        iconTone: 'bg-emerald-500 text-white',
      },
      {
        type: 'plugin',
        name: '插件',
        description: '调用内置插件完成动作',
        category: '工具',
        tone: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
        iconTone: 'bg-violet-500 text-white',
      },
      {
        type: 'mcp',
        name: 'MCP 工具',
        description: '连接外部 MCP 工具能力',
        category: '工具',
        tone: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
        iconTone: 'bg-amber-500 text-white',
      },
    ],
  },
  {
    title: '逻辑',
    items: [
      {
        type: 'condition',
        name: '条件判断',
        description: '根据表达式选择执行分支',
        category: '逻辑',
        tone: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
        iconTone: 'bg-orange-500 text-white',
      },
      {
        type: 'code',
        name: '代码执行',
        description: '执行自定义脚本处理数据',
        category: '逻辑',
        tone: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
        iconTone: 'bg-rose-500 text-white',
      },
    ],
  },
];

export const START_NODE_DEF: WorkflowNodeDef = {
  type: 'start',
  name: '开始',
  description: '工作流入口',
  category: '系统',
  tone: 'bg-success/10 text-success border-success/20',
  iconTone: 'bg-success text-white',
};

export const END_NODE_DEF: WorkflowNodeDef = {
  type: 'end',
  name: '结束',
  description: '工作流出口',
  category: '系统',
  tone: 'bg-muted text-muted-foreground border-border',
  iconTone: 'bg-muted-foreground text-background',
};

export const NODE_DEFS = [
  START_NODE_DEF,
  END_NODE_DEF,
  ...NODE_CATEGORIES.flatMap((category) => category.items),
];

export const NODE_DEF_MAP = NODE_DEFS.reduce<Record<WorkflowNodeType, WorkflowNodeDef>>(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<WorkflowNodeType, WorkflowNodeDef>,
);

export const NODE_ICON_MAP: Record<WorkflowNodeType, React.ElementType> = {
  start: Play,
  end: Square,
  llm: BrainCircuit,
  knowledge: Database,
  http: Globe,
  reply: MessageSquare,
  condition: GitBranch,
  code: Code2,
  plugin: Layers,
  mcp: PlugZap,
};

export const NODE_FALLBACK_ICON = Bot;
export const NODE_STATUS_ICON = Zap;
