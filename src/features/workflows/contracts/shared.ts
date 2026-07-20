import type {
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowNodeConfig,
  WorkflowNodeType,
  WorkflowOutputSchema,
  WorkflowValueType,
} from '../types';

export const DEFAULT_MODULE_VERSION = '481';

export function valueTypeToRenderType(valueType: WorkflowValueType) {
  switch (valueType) {
    case 'number':
      return 'numberInput';
    case 'boolean':
      return 'switch';
    case 'file':
      return 'file';
    case 'object':
    case 'array':
      return 'textarea';
    default:
      return 'input';
  }
}

export function toModuleOutputs(outputs: WorkflowOutputSchema[]): WorkflowModuleOutput[] {
  return outputs.map((output) => ({
    id: output.key,
    key: output.key,
    type: 'static',
    valueType: output.valueType,
    label: output.label,
  }));
}

export function createCanvasNode(
  type: WorkflowNodeType,
  module: WorkflowModule,
  config: WorkflowNodeConfig,
): WorkflowCanvasNode {
  return {
    id: module.nodeId,
    type,
    position: module.position,
    data: {
      label: module.name,
      nodeType: type,
      description: module.intro ?? '',
      config,
    },
  };
}

export function parseInputValue(inputs: WorkflowModuleInput[], key: string): unknown {
  return inputs.find((input) => input.key === key)?.value;
}

export function parseStringInput(inputs: WorkflowModuleInput[], key: string): string {
  const value = parseInputValue(inputs, key);
  return value == null ? '' : String(value);
}

export function parseNumberInput(
  inputs: WorkflowModuleInput[],
  key: string,
  fallback: number,
) {
  const value = Number(parseInputValue(inputs, key));
  return Number.isNaN(value) ? fallback : value;
}

export function parseBooleanInput(
  inputs: WorkflowModuleInput[],
  key: string,
  fallback: boolean,
) {
  const value = parseInputValue(inputs, key);
  return typeof value === 'boolean' ? value : fallback;
}
