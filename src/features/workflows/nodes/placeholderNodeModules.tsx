import { Layers, PlugZap } from 'lucide-react';
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
];

export const placeholderNodeModules = definitions.map(([definition, icon]) =>
  createPlaceholderNodeModule(definition, icon),
);

export function isPlaceholderNodeType(type: WorkflowNodeType) {
  return placeholderNodeModules.some((module) => module.type === type);
}
