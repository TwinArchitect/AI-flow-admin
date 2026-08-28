import type {
  BackendFlowNodeType,
  WorkflowCanvasNode,
  WorkflowNodeCategory,
  WorkflowNodeType,
} from '../types';
import { baseChartNodeModule } from './baseChartNodeModule';
import { concatNodeModule } from './concatNodeModule';
import { classifyNodeModule } from './classifyNodeModule';
import { codeNodeModule } from './codeNodeModule';
import { conditionNodeModule } from './conditionNodeModule';
import { datasetSearchNodeModule } from './datasetSearchNodeModule';
import { databaseNodeModule } from './databaseNodeModule';
import { endNodeModule } from './endNodeModule';
import { httpNodeModule } from './httpNodeModule';
import { llmNodeModule } from './llmNodeModule';
import { loopBreakNodeModule, loopNodeModule, loopStartNodeModule } from './loopNodeModule';
import { placeholderNodeModules } from './placeholderNodeModules';
import { replyNodeModule } from './replyNodeModule';
import { readFilesNodeModule } from './readFilesNodeModule';
import { startNodeModule } from './startNodeModule';
import { variableUpdateNodeModule } from './variableUpdateNodeModule';
import type { WorkflowNodeModule } from './types';

export const WORKFLOW_NODE_MODULES: WorkflowNodeModule[] = [
  startNodeModule,
  endNodeModule,
  concatNodeModule,
  conditionNodeModule,
  codeNodeModule,
  classifyNodeModule,
  variableUpdateNodeModule,
  llmNodeModule,
  httpNodeModule,
  databaseNodeModule,
  readFilesNodeModule,
  baseChartNodeModule,
  loopNodeModule,
  loopStartNodeModule,
  loopBreakNodeModule,
  datasetSearchNodeModule,
  replyNodeModule,
  ...placeholderNodeModules,
];

export const NODE_MODULE_REGISTRY = new Map<WorkflowNodeType, WorkflowNodeModule>(
  WORKFLOW_NODE_MODULES.map((module) => [module.type, module]),
);

const BACKEND_NODE_MODULE_REGISTRY = new Map<BackendFlowNodeType, WorkflowNodeModule>(
  WORKFLOW_NODE_MODULES.flatMap((module) =>
    module.backendType ? [[module.backendType, module]] : [],
  ),
);

export function getNodeModule(type: WorkflowNodeType) {
  const module = NODE_MODULE_REGISTRY.get(type);
  if (!module) throw new Error(`未注册的工作流节点类型：${type}`);
  return module;
}

export function getNodeModuleByBackendType(type: BackendFlowNodeType) {
  return BACKEND_NODE_MODULE_REGISTRY.get(type);
}

export function getNodeConnectionRules(node: WorkflowCanvasNode) {
  const module = getNodeModule(node.data.nodeType);
  return module.resolveConnectionRules?.(node) ?? module.connection;
}

const CATEGORY_ORDER = ['基础', '工具', '逻辑', '数据'];

export const REGISTERED_NODE_CATEGORIES: WorkflowNodeCategory[] = CATEGORY_ORDER.map((title) => ({
  title,
  items: WORKFLOW_NODE_MODULES
    .filter((module) => module.backendRunnable && module.paletteVisible !== false && module.definition.category === title)
    .map((module) => module.definition),
})).filter((category) => category.items.length > 0);
