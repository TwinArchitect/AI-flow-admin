import type {
  VariableUpdateItem,
  VariableUpdateNodeConfig,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowValueType,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseInputValue } from './shared';

export const VARIABLE_UPDATE_NODE_DESCRIPTION = '更新全局变量或指定上游节点的输出值';

export const VARIABLE_UPDATE_VALUE_TYPES: WorkflowValueType[] = [
  'string',
  'number',
  'boolean',
  'object',
  'any',
  'arrayString',
  'arrayNumber',
  'arrayBoolean',
  'arrayObject',
  'arrayAny',
];

interface BackendVariableUpdateRow {
  variable?: unknown;
  value?: unknown;
  valueType?: unknown;
  renderType?: unknown;
}

function createId(index?: number) {
  return index == null
    ? `variable-update-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    : `variable-update-${index}`;
}

export function createVariableUpdateItem(): VariableUpdateItem {
  return {
    id: createId(),
    variableRef: '',
    valueMode: 'input',
    value: '',
    valueType: 'string',
  };
}

export function createDefaultVariableUpdateConfig(): VariableUpdateNodeConfig {
  return { updateList: [] };
}

export function normalizeVariableUpdateConfig(config: unknown): VariableUpdateNodeConfig {
  const raw = (config ?? {}) as Partial<VariableUpdateNodeConfig>;
  const updateList = Array.isArray(raw.updateList) ? raw.updateList : [];
  return {
    updateList: updateList.map((item, index) => {
      const value = (item ?? {}) as Partial<VariableUpdateItem>;
      return {
        id: typeof value.id === 'string' && value.id ? value.id : createId(index),
        variableRef: typeof value.variableRef === 'string' ? value.variableRef : '',
        valueMode: value.valueMode === 'reference' ? 'reference' : 'input',
        value: typeof value.value === 'string' ? value.value : '',
        valueType: VARIABLE_UPDATE_VALUE_TYPES.includes(value.valueType as WorkflowValueType)
          ? value.valueType as WorkflowValueType
          : 'string',
      };
    }),
  };
}

function parseBackendValue(row: BackendVariableUpdateRow) {
  if (row.renderType === 'reference') {
    return { valueMode: 'reference' as const, value: moduleRefToString(row.value) };
  }
  if (Array.isArray(row.value)) {
    return {
      valueMode: 'input' as const,
      value: row.value.length > 1 && row.value[1] != null ? String(row.value[1]) : '',
    };
  }
  return { valueMode: 'input' as const, value: row.value == null ? '' : String(row.value) };
}

export function serializeVariableUpdateNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeVariableUpdateConfig(node.data.config);
  return {
    flowNodeType: 'variableUpdate',
    avatar: 'core/workflow/template/variableUpdate',
    name: node.data.label,
    intro: VARIABLE_UPDATE_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: false,
    inputs: [{
      key: 'updateList',
      label: '',
      valueType: 'any',
      renderTypeList: ['hidden'],
      value: config.updateList
        .filter((item) => item.variableRef.trim())
        .map((item) => ({
          variable: stringToModuleRef(item.variableRef),
          value: item.valueMode === 'reference'
            ? stringToModuleRef(item.value)
            : ['', item.value],
          valueType: item.valueType,
          renderType: item.valueMode === 'reference' ? 'reference' : 'input',
        })),
      debugLabel: '',
      toolDescription: '',
    }],
    outputs: [],
  };
}

export function parseVariableUpdateModule(module: WorkflowModule) {
  const rawList = parseInputValue(module.inputs ?? [], 'updateList');
  const rows = Array.isArray(rawList) ? rawList : [];
  const config: VariableUpdateNodeConfig = {
    updateList: rows.map((row, index) => {
      const value = (row ?? {}) as BackendVariableUpdateRow;
      const parsedValue = parseBackendValue(value);
      return {
        id: createId(index),
        variableRef: moduleRefToString(value.variable),
        valueMode: parsedValue.valueMode,
        value: parsedValue.value,
        valueType: VARIABLE_UPDATE_VALUE_TYPES.includes(value.valueType as WorkflowValueType)
          ? value.valueType as WorkflowValueType
          : 'string',
      };
    }),
  };
  const node = createCanvasNode('variableUpdate', module, config);
  node.data.description = VARIABLE_UPDATE_NODE_DESCRIPTION;
  return node;
}

export function getVariableUpdateReferences(node: WorkflowCanvasNode) {
  const config = normalizeVariableUpdateConfig(node.data.config);
  return config.updateList.flatMap((item, index) => [
    {
      value: item.variableRef,
      context: `节点 ${node.data.label} 的更新项 ${index + 1} 目标变量`,
    },
    ...(item.valueMode === 'reference' ? [{
      value: item.value,
      context: `节点 ${node.data.label} 的更新项 ${index + 1} 赋值变量`,
    }] : []),
  ]);
}

export function validateVariableUpdateNode(node: WorkflowCanvasNode) {
  const config = normalizeVariableUpdateConfig(node.data.config);
  const errors: string[] = [];
  if (config.updateList.length === 0) {
    errors.push(`节点 ${node.data.label} 至少需要一个更新项`);
  }
  config.updateList.forEach((item, index) => {
    if (!parseVariableRef(item.variableRef)) {
      errors.push(`节点 ${node.data.label} 的更新项 ${index + 1} 必须选择目标变量`);
    }
    if (item.valueMode === 'reference' && !parseVariableRef(item.value)) {
      errors.push(`节点 ${node.data.label} 的更新项 ${index + 1} 必须选择赋值变量`);
    }
  });
  return errors;
}
