import type {
  ConditionBranch,
  ConditionNodeConfig,
  ConditionOperator,
  ConditionRule,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, DEFAULT_MODULE_VERSION, parseInputValue } from './shared';

export const CONDITION_NODE_DESCRIPTION = '根据条件判断执行不同分支';

export const CONDITION_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'ifElseResult', label: '判断结果', valueType: 'string' },
];

export const CONDITION_OPERATOR_OPTIONS: Array<{
  value: ConditionOperator;
  label: string;
  needsValue: boolean;
}> = [
  { value: 'equalTo', label: '等于', needsValue: true },
  { value: 'notEqual', label: '不等于', needsValue: true },
  { value: 'isEmpty', label: '为空', needsValue: false },
  { value: 'include', label: '包含', needsValue: true },
  { value: 'notInclude', label: '不包含', needsValue: true },
  { value: 'startWith', label: '开头是', needsValue: true },
  { value: 'endWith', label: '结尾是', needsValue: true },
  { value: 'reg', label: '正则匹配', needsValue: true },
  { value: 'greaterThan', label: '大于', needsValue: true },
  { value: 'greaterThanOrEqualTo', label: '大于等于', needsValue: true },
  { value: 'lessThan', label: '小于', needsValue: true },
  { value: 'lessThanOrEqualTo', label: '小于等于', needsValue: true },
];

const CONDITION_OPERATORS = new Set(CONDITION_OPERATOR_OPTIONS.map((item) => item.value));

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createConditionRule(): ConditionRule {
  return {
    id: createId('condition-rule'),
    variableRef: '',
    condition: 'equalTo',
    valueMode: 'input',
    value: '',
  };
}

export function createConditionBranch(): ConditionBranch {
  return {
    id: createId('condition-branch'),
    condition: 'AND',
    rules: [createConditionRule()],
  };
}

export function createDefaultConditionConfig(): ConditionNodeConfig {
  return { branches: [createConditionBranch()] };
}

export function conditionOperatorNeedsValue(operator: ConditionOperator) {
  return CONDITION_OPERATOR_OPTIONS.find((item) => item.value === operator)?.needsValue ?? true;
}

export function normalizeConditionConfig(config: unknown): ConditionNodeConfig {
  const raw = (config ?? {}) as Partial<ConditionNodeConfig>;
  const branches = Array.isArray(raw.branches) ? raw.branches : [];
  return {
    branches: branches.map((branch, branchIndex) => {
      const rawBranch = (branch ?? {}) as Partial<ConditionBranch>;
      const rules = Array.isArray(rawBranch.rules) ? rawBranch.rules : [];
      return {
        id: typeof rawBranch.id === 'string' && rawBranch.id
          ? rawBranch.id
          : `condition-branch-${branchIndex}`,
        condition: rawBranch.condition === 'OR' ? 'OR' : 'AND',
        rules: rules.map((rule, ruleIndex) => {
          const rawRule = (rule ?? {}) as Partial<ConditionRule>;
          const operator = CONDITION_OPERATORS.has(rawRule.condition as ConditionOperator)
            ? rawRule.condition as ConditionOperator
            : 'equalTo';
          return {
            id: typeof rawRule.id === 'string' && rawRule.id
              ? rawRule.id
              : `condition-rule-${branchIndex}-${ruleIndex}`,
            variableRef: typeof rawRule.variableRef === 'string' ? rawRule.variableRef : '',
            condition: operator,
            valueMode: rawRule.valueMode === 'reference' ? 'reference' : 'input',
            value: typeof rawRule.value === 'string' ? rawRule.value : '',
          };
        }),
      };
    }),
  };
}

interface BackendConditionRule {
  variable?: unknown;
  condition?: unknown;
  value?: unknown;
  valueType?: unknown;
}

interface BackendConditionBranch {
  condition?: unknown;
  list?: unknown;
}

export function serializeConditionNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeConditionConfig(node.data.config);
  return {
    flowNodeType: 'ifElseNode',
    avatar: 'core/workflow/template/ifelse',
    name: node.data.label,
    intro: CONDITION_NODE_DESCRIPTION,
    version: DEFAULT_MODULE_VERSION,
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    inputs: [{
      key: 'ifElseList',
      label: '',
      valueType: 'any',
      renderTypeList: ['hidden'],
      value: config.branches.map((branch) => ({
        condition: branch.condition,
        list: branch.rules.map((rule) => ({
          variable: stringToModuleRef(rule.variableRef),
          condition: rule.condition,
          ...(conditionOperatorNeedsValue(rule.condition) ? {
            value: rule.valueMode === 'reference' ? stringToModuleRef(rule.value) : rule.value,
            valueType: rule.valueMode,
          } : {}),
        })),
      })),
      debugLabel: '',
      toolDescription: '',
    }],
    outputs: [{
      id: 'ifElseResult',
      key: 'ifElseResult',
      type: 'static',
      valueType: 'string',
      valueDesc: '',
      label: '判断结果',
      description: '',
    }],
  };
}

export function parseConditionModule(module: WorkflowModule) {
  const rawBranches = parseInputValue(module.inputs ?? [], 'ifElseList');
  const branches = Array.isArray(rawBranches) ? rawBranches : [];
  const config: ConditionNodeConfig = {
    branches: branches.map((branch, branchIndex) => {
      const rawBranch = (branch ?? {}) as BackendConditionBranch;
      const rules = Array.isArray(rawBranch.list) ? rawBranch.list : [];
      return {
        id: `condition-branch-${branchIndex}`,
        condition: rawBranch.condition === 'OR' ? 'OR' : 'AND',
        rules: rules.map((rule, ruleIndex) => {
          const rawRule = (rule ?? {}) as BackendConditionRule;
          const operator = CONDITION_OPERATORS.has(rawRule.condition as ConditionOperator)
            ? rawRule.condition as ConditionOperator
            : 'equalTo';
          return {
            id: `condition-rule-${branchIndex}-${ruleIndex}`,
            variableRef: moduleRefToString(rawRule.variable),
            condition: operator,
            valueMode: rawRule.valueType === 'reference' ? 'reference' : 'input',
            value: conditionOperatorNeedsValue(operator) ? moduleRefToString(rawRule.value) : '',
          };
        }),
      };
    }),
  };
  const node = createCanvasNode('condition', module, normalizeConditionConfig(config));
  node.data.description = CONDITION_NODE_DESCRIPTION;
  return node;
}

export function getConditionReferences(node: WorkflowCanvasNode) {
  const config = normalizeConditionConfig(node.data.config);
  return config.branches.flatMap((branch, branchIndex) =>
    branch.rules.flatMap((rule, ruleIndex) => {
      const references = [{
        value: rule.variableRef,
        context: `节点 ${node.data.label} 的分支 ${branchIndex + 1} 条件 ${ruleIndex + 1} 左值`,
      }];
      if (conditionOperatorNeedsValue(rule.condition) && rule.valueMode === 'reference') {
        references.push({
          value: rule.value,
          context: `节点 ${node.data.label} 的分支 ${branchIndex + 1} 条件 ${ruleIndex + 1} 右值`,
        });
      }
      return references;
    }),
  );
}

export function validateConditionNode(node: WorkflowCanvasNode) {
  const config = normalizeConditionConfig(node.data.config);
  const errors: string[] = [];
  if (config.branches.length === 0) {
    errors.push(`节点 ${node.data.label} 至少需要一个条件分支`);
    return errors;
  }
  config.branches.forEach((branch, branchIndex) => {
    if (branch.rules.length === 0) {
      errors.push(`节点 ${node.data.label} 的分支 ${branchIndex + 1} 至少需要一个条件`);
    }
    branch.rules.forEach((rule, ruleIndex) => {
      if (!parseVariableRef(rule.variableRef)) {
        errors.push(`节点 ${node.data.label} 的分支 ${branchIndex + 1} 条件 ${ruleIndex + 1} 必须选择上游变量`);
      }
      if (!conditionOperatorNeedsValue(rule.condition)) return;
      if (!rule.value.trim()) {
        errors.push(`节点 ${node.data.label} 的分支 ${branchIndex + 1} 条件 ${ruleIndex + 1} 缺少比较值`);
      } else if (rule.valueMode === 'reference' && !parseVariableRef(rule.value)) {
        errors.push(`节点 ${node.data.label} 的分支 ${branchIndex + 1} 条件 ${ruleIndex + 1} 必须选择右侧变量`);
      }
    });
  });
  return errors;
}
