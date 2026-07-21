import type { StartVariable, WorkflowCanvasNode } from '../types';
import { isSystemStartVariable, normalizeStartConfig } from '../contracts/startNodeContract';

export interface WorkflowDebugContext {
  customStartVariables: StartVariable[];
  needsVariableForm: boolean;
}

export function getWorkflowDebugContext(nodes: WorkflowCanvasNode[]): WorkflowDebugContext {
  const startNode = nodes.find((node) => node.data.nodeType === 'start');
  const customStartVariables = startNode
    ? normalizeStartConfig(startNode.data.config).variables.filter(
        (variable) => !isSystemStartVariable(variable),
      )
    : [];

  return {
    customStartVariables,
    needsVariableForm: customStartVariables.length > 0,
  };
}

export function buildDebugVariableDefaults(variables: StartVariable[]): Record<string, string> {
  return Object.fromEntries(
    variables.map((variable) => [variable.key, variable.defaultValue ?? '']),
  );
}

export function validateDebugVariables(
  variables: StartVariable[],
  values: Record<string, string>,
): string | null {
  for (const variable of variables) {
    const name = variable.description?.trim() || variable.label?.trim() || variable.key;
    const raw = values[variable.key]?.trim() ?? '';
    if (variable.required && !raw) return `请填写「${name}」`;
    if (!raw) continue;
    if (variable.valueType === 'number' && Number.isNaN(Number(raw))) {
      return `「${name}」需为有效数字`;
    }
    if (variable.valueType === 'object' || variable.valueType === 'array') {
      try {
        JSON.parse(raw);
      } catch {
        return `「${name}」需为合法 JSON`;
      }
    }
  }
  return null;
}

export function buildWorkflowRunVariables(
  values: Record<string, string>,
  variables: StartVariable[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  variables.forEach((variable) => {
    const raw = values[variable.key]?.trim() ?? '';
    if (!raw) return;
    const apiKey = variable.label?.trim() || variable.key;
    if (variable.valueType === 'number') result[apiKey] = Number(raw);
    else if (variable.valueType === 'boolean') result[apiKey] = raw === 'true';
    else if (variable.valueType === 'object' || variable.valueType === 'array') {
      result[apiKey] = JSON.parse(raw) as unknown;
    } else result[apiKey] = raw;
  });
  return result;
}
