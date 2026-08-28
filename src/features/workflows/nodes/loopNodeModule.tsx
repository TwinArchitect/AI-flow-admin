import { Play, Repeat2, Square } from 'lucide-react';
import { LoopConfigPanel } from '../components/config-panels/LoopConfigPanel';
import { LoopContainerNode } from '../components/LoopContainerNode';
import { DefaultNodeExecutionDetails } from '../components/node-execution/DefaultNodeExecutionDetails';
import {
  LOOP_NODE_DESCRIPTION,
  LOOP_START_OUTPUTS,
  createDefaultLoopConfig,
  createDefaultLoopStartConfig,
  getLoopReferences,
  loopOutputs,
  parseLoopBreakNode,
  parseLoopNode,
  parseLoopStartNode,
  serializeLoopBreakNode,
  serializeLoopNode,
  serializeLoopStartNode,
  validateLoopNode,
} from '../contracts/loopNodeContract';
import type { LoopNodeConfig } from '../types';
import type { NodeConfigPanelProps, WorkflowNodeModule } from './types';

function EmptyConfigPanel() {
  return <p className="text-xs leading-relaxed text-muted-foreground">该节点由循环体管理，无需单独配置。</p>;
}

function LoopPanel({ config, variables, onUpdate }: NodeConfigPanelProps) {
  return <LoopConfigPanel config={config as Record<string, unknown>} variables={variables} onUpdate={onUpdate as (config: Partial<LoopNodeConfig>) => void} />;
}

export const loopNodeModule: WorkflowNodeModule = {
  type: 'loop',
  backendType: 'loopRun',
  backendRunnable: true,
  definition: {
    type: 'loop', name: '循环体', description: LOOP_NODE_DESCRIPTION, category: '逻辑',
    tone: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400', iconTone: 'bg-violet-500 text-white',
  },
  icon: Repeat2,
  CanvasComponent: LoopContainerNode,
  createDefaultConfig: () => ({ ...createDefaultLoopConfig() }),
  ConfigPanel: LoopPanel,
  ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: (node) => loopOutputs(node.data.config),
  getReferences: getLoopReferences,
  serialize: serializeLoopNode,
  parse: parseLoopNode,
  validate: validateLoopNode,
  connection: { allowIncoming: true, allowOutgoing: true, deletable: true, requireIncoming: true, requireOutgoing: true, maxIncoming: 1, maxOutgoing: 1 },
};

export const loopStartNodeModule: WorkflowNodeModule = {
  type: 'loopStart', backendType: 'loopRunStart', backendRunnable: true, paletteVisible: false,
  definition: { type: 'loopStart', name: '循环开始', description: '每轮循环的起点，输出当前索引与当前项', category: '逻辑', tone: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400', iconTone: 'bg-emerald-500 text-white' },
  icon: Play,
  createDefaultConfig: () => ({ ...createDefaultLoopStartConfig() }), ConfigPanel: EmptyConfigPanel, ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => LOOP_START_OUTPUTS, getReferences: () => [], serialize: serializeLoopStartNode, parse: parseLoopStartNode, validate: () => [],
  connection: { allowIncoming: false, allowOutgoing: true, deletable: false, requireOutgoing: true, maxOutgoing: 1 },
};

export const loopBreakNodeModule: WorkflowNodeModule = {
  type: 'loopBreak', backendType: 'loopRunBreak', backendRunnable: true, paletteVisible: false,
  definition: { type: 'loopBreak', name: '循环终止', description: '执行到此节点时终止剩余循环', category: '逻辑', tone: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400', iconTone: 'bg-rose-500 text-white' },
  icon: Square,
  createDefaultConfig: () => ({}), ConfigPanel: EmptyConfigPanel, ExecutionDetails: DefaultNodeExecutionDetails,
  getOutputs: () => [], getReferences: () => [], serialize: serializeLoopBreakNode, parse: parseLoopBreakNode, validate: () => [],
  connection: { allowIncoming: true, allowOutgoing: false, deletable: false, maxIncoming: 1 },
};
