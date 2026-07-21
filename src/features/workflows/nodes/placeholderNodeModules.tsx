import { Code2, Database, GitBranch, Layers, MessageSquare, PlugZap } from 'lucide-react';
import type { ElementType } from 'react';
import { PlaceholderConfigPanel } from '../components/config-panels/PlaceholderConfigPanel';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import type { WorkflowNodeDef, WorkflowNodeType } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function createPlaceholderNodeModule(
  definition: WorkflowNodeDef,
  icon: ElementType,
): WorkflowNodeModule {
  function ConfigPanel(_props: NodeConfigPanelProps) {
    return <PlaceholderConfigPanel def={definition} />;
  }

  return {
    type: definition.type,
    backendRunnable: false,
    definition,
    icon,
    createDefaultConfig: () => ({}),
    ConfigPanel,
    ExecutionDetails: DefaultNodeExecutionDetails,
    getOutputs: () => [],
    getReferences: () => [],
    validate: () => [],
    connection: {
      allowIncoming: true,
      allowOutgoing: true,
      deletable: true,
    },
  };
}

const definitions: Array<[WorkflowNodeDef, ElementType]> = [
  [{
    type: 'knowledge',
    name: '知识库',
    description: '检索知识库并返回相关片段',
    category: '基础',
    tone: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
    iconTone: 'bg-sky-500 text-white',
  }, Database],
  [{
    type: 'reply',
    name: '指定回复',
    description: '输出固定文本或变量内容',
    category: '工具',
    tone: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    iconTone: 'bg-emerald-500 text-white',
  }, MessageSquare],
  [{
    type: 'plugin',
    name: '插件',
    description: '调用内置插件完成动作',
    category: '工具',
    tone: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
    iconTone: 'bg-violet-500 text-white',
  }, Layers],
  [{
    type: 'mcp',
    name: 'MCP 工具',
    description: '连接外部 MCP 工具能力',
    category: '工具',
    tone: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    iconTone: 'bg-amber-500 text-white',
  }, PlugZap],
  [{
    type: 'condition',
    name: '条件判断',
    description: '根据表达式选择执行分支',
    category: '逻辑',
    tone: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
    iconTone: 'bg-orange-500 text-white',
  }, GitBranch],
  [{
    type: 'code',
    name: '代码执行',
    description: '执行自定义脚本处理数据',
    category: '逻辑',
    tone: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    iconTone: 'bg-rose-500 text-white',
  }, Code2],
];

export const placeholderNodeModules = definitions.map(([definition, icon]) =>
  createPlaceholderNodeModule(definition, icon),
);

export function isPlaceholderNodeType(type: WorkflowNodeType) {
  return placeholderNodeModules.some((module) => module.type === type);
}
