import type {
  EndNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowOutputSchema,
} from '../types';
import { createCanvasNode, DEFAULT_MODULE_VERSION } from './shared';

export const DEFAULT_END_CONFIG: EndNodeConfig = {
  outputVariables: [
    {
      id: 'end-var-answer',
      key: 'answer',
      value: '{{llm-demo.answerText}}',
    },
  ],
};

export function normalizeEndConfig(config: unknown): EndNodeConfig {
  const raw = (config ?? {}) as Partial<EndNodeConfig>;
  return {
    ...DEFAULT_END_CONFIG,
    ...raw,
    outputVariables: raw.outputVariables?.length
      ? raw.outputVariables
      : DEFAULT_END_CONFIG.outputVariables,
  };
}

export function resolveEndNodeOutputs(node: WorkflowCanvasNode): WorkflowOutputSchema[] {
  return normalizeEndConfig(node.data.config).outputVariables
    .filter((variable) => variable.key.trim())
    .map((variable) => ({
      key: variable.key.trim(),
      label: variable.key.trim(),
      valueType: 'string',
    }));
}

export function serializeEndNode(node: WorkflowCanvasNode): WorkflowModule {
  const outputVariables = normalizeEndConfig(node.data.config).outputVariables
    .filter((variable) => variable.key.trim());
  return {
    flowNodeType: 'workflowEnd',
    avatar: 'core/workflow/template/workflowEnd',
    name: node.data.label,
    intro: node.data.description,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    inputs: outputVariables.map((variable) => ({
      key: variable.key.trim(),
      label: variable.key.trim(),
      valueType: 'string',
      renderTypeList: ['reference'],
      value: variable.value,
    })),
    outputs: outputVariables.map((variable) => ({
      id: variable.key.trim(),
      key: variable.key.trim(),
      type: 'static',
      valueType: 'string',
      label: variable.key.trim(),
    })),
  };
}

export function parseEndModule(module: WorkflowModule) {
  const outputVariables = (module.inputs ?? [])
    .filter((input) => input.key.trim())
    .map((input, index) => ({
      id: `end-var-${input.key || index}`,
      key: input.key,
      value: input.value == null ? '' : String(input.value),
    }));
  return createCanvasNode('end', module, {
    ...DEFAULT_END_CONFIG,
    outputVariables: outputVariables.length ? outputVariables : DEFAULT_END_CONFIG.outputVariables,
  });
}

export function validateEndNode(node: WorkflowCanvasNode) {
  const variables = normalizeEndConfig(node.data.config).outputVariables;
  const keys = variables.map((variable) => variable.key.trim()).filter(Boolean);
  const errors: string[] = [];
  if (keys.length === 0) errors.push('结束节点至少需要一个输出字段');
  if (new Set(keys).size !== keys.length) errors.push('结束节点输出字段名不能重复');
  variables.forEach((variable) => {
    if (variable.key.trim() && !variable.value.trim()) {
      errors.push(`结束节点输出 ${variable.key.trim()} 的引用不能为空`);
    }
  });
  return errors;
}
