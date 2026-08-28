import type {
  DatabaseNodeConfig,
  DatabaseType,
  WorkflowCanvasNode,
  WorkflowModule,
  WorkflowModuleInput,
  WorkflowModuleOutput,
  WorkflowOutputSchema,
} from '../types';
import { moduleRefToString, parseVariableRef, stringToModuleRef } from '../utils/variableRefs';
import { createCanvasNode, parseInputValue, parseStringInput } from './shared';

export const DATABASE_NODE_DESCRIPTION = '连接 MySQL、Oracle 或人大金仓，执行 SQL 并返回结果';
export const DATABASE_TIMEOUT_MIN = 1;
export const DATABASE_TIMEOUT_MAX = 300;
export const DATABASE_TIMEOUT_DEFAULT = 30;

export const DATABASE_TYPE_OPTIONS: Array<{ label: string; value: DatabaseType }> = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'Oracle', value: 'oracle' },
  { label: '人大金仓', value: 'kingbase' },
];

export const DATABASE_NODE_OUTPUTS: WorkflowOutputSchema[] = [
  { key: 'result', label: '结果', valueType: 'string' },
  { key: 'system_error_text', label: '错误信息', valueType: 'string' },
];

const DATABASE_MODULE_OUTPUTS: WorkflowModuleOutput[] = [
  {
    id: 'result',
    key: 'result',
    type: 'static',
    valueType: 'string',
    valueDesc: '',
    label: '结果',
    description: '执行结果',
    required: true,
  },
  {
    id: 'system_error_text',
    key: 'system_error_text',
    type: 'error',
    valueType: 'string',
    valueDesc: '',
    label: '错误信息',
    description: '',
  },
];

function normalizeDbType(value: unknown): DatabaseType {
  return DATABASE_TYPE_OPTIONS.some((item) => item.value === value)
    ? value as DatabaseType
    : 'mysql';
}

function normalizeTimeout(value: unknown) {
  const number = Number(value ?? DATABASE_TIMEOUT_DEFAULT);
  if (Number.isNaN(number)) return DATABASE_TIMEOUT_DEFAULT;
  return Math.min(DATABASE_TIMEOUT_MAX, Math.max(DATABASE_TIMEOUT_MIN, number));
}

export function createDefaultDatabaseConfig(): DatabaseNodeConfig {
  return {
    dbType: 'mysql',
    databaseName: '',
    host: '',
    username: '',
    password: '',
    connectTimeout: DATABASE_TIMEOUT_DEFAULT,
    sql: { valueMode: 'input', value: '' },
    catchError: false,
  };
}

export function normalizeDatabaseConfig(config: unknown): DatabaseNodeConfig {
  const raw = (config ?? {}) as Partial<DatabaseNodeConfig>;
  return {
    dbType: normalizeDbType(raw.dbType),
    databaseName: String(raw.databaseName ?? ''),
    host: String(raw.host ?? ''),
    username: String(raw.username ?? ''),
    password: String(raw.password ?? ''),
    connectTimeout: normalizeTimeout(raw.connectTimeout),
    sql: {
      valueMode: raw.sql?.valueMode === 'reference' ? 'reference' : 'input',
      value: String(raw.sql?.value ?? ''),
    },
    catchError: Boolean(raw.catchError),
  };
}

function databaseInput(
  key: string,
  value: unknown,
  valueType: 'string' | 'number' = 'string',
): WorkflowModuleInput {
  return {
    key,
    label: key,
    valueType,
    required: true,
    renderTypeList: [valueType === 'number' ? 'numberInput' : 'input'],
    value,
  };
}

export function serializeDatabaseNode(node: WorkflowCanvasNode): WorkflowModule {
  const config = normalizeDatabaseConfig(node.data.config);
  return {
    flowNodeType: 'databaseQuery',
    avatar: 'core/workflow/template/database',
    name: node.data.label,
    intro: DATABASE_NODE_DESCRIPTION,
    version: '1.0.0',
    nodeId: node.id,
    position: node.position,
    showStatus: true,
    catchError: config.catchError,
    inputs: [
      databaseInput('dbType', config.dbType),
      databaseInput('databaseName', config.databaseName),
      { ...databaseInput('url', config.host), placeholder: '127.0.0.1:3306' },
      databaseInput('username', config.username),
      databaseInput('password', config.password),
      {
        ...databaseInput('connectTimeout', config.connectTimeout, 'number'),
        min: DATABASE_TIMEOUT_MIN,
        max: DATABASE_TIMEOUT_MAX,
      },
      {
        ...databaseInput(
          'sql',
          config.sql.valueMode === 'reference' ? stringToModuleRef(config.sql.value) : config.sql.value,
        ),
        renderTypeList: ['input', 'reference'],
        selectedTypeIndex: config.sql.valueMode === 'reference' ? 1 : 0,
      },
    ],
    outputs: DATABASE_MODULE_OUTPUTS.map((output) => ({ ...output })),
  };
}

export function parseDatabaseModule(module: WorkflowModule) {
  const inputs = module.inputs ?? [];
  const sqlInput = inputs.find((input) => input.key === 'sql');
  const sqlValue = sqlInput?.value;
  const sqlRenderTypes = sqlInput?.renderTypeList ?? ['input', 'reference'];
  const sqlMode = sqlRenderTypes[sqlInput?.selectedTypeIndex ?? 0] === 'reference'
    ? 'reference'
    : 'input';
  const node = createCanvasNode('database', module, normalizeDatabaseConfig({
    dbType: parseStringInput(inputs, 'dbType'),
    databaseName: parseStringInput(inputs, 'databaseName'),
    host: parseStringInput(inputs, 'url') || parseStringInput(inputs, 'host'),
    username: parseStringInput(inputs, 'username'),
    password: parseStringInput(inputs, 'password'),
    connectTimeout: parseInputValue(inputs, 'connectTimeout'),
    sql: {
      valueMode: sqlMode,
      value: moduleRefToString(sqlValue),
    },
    catchError: Boolean(module.catchError),
  }));
  node.data.description = DATABASE_NODE_DESCRIPTION;
  return node;
}

export function getDatabaseReferences(node: WorkflowCanvasNode) {
  const config = normalizeDatabaseConfig(node.data.config);
  if (config.sql.valueMode !== 'reference' || !parseVariableRef(config.sql.value)) return [];
  return [{
    value: config.sql.value,
    context: `节点 ${node.data.label} 的 SQL 语句`,
    acceptedValueTypes: ['string' as const],
  }];
}

export function validateDatabaseNode(node: WorkflowCanvasNode) {
  const config = normalizeDatabaseConfig(node.data.config);
  const errors: string[] = [];
  if (!config.databaseName.trim()) errors.push(`节点 ${node.data.label} 缺少数据库名称`);
  if (!config.host.trim()) errors.push(`节点 ${node.data.label} 缺少数据库地址`);
  if (!config.username.trim()) errors.push(`节点 ${node.data.label} 缺少数据库用户名`);
  if (!config.password) errors.push(`节点 ${node.data.label} 缺少数据库密码`);
  if (!config.sql.value.trim()) errors.push(`节点 ${node.data.label} 缺少 SQL 语句`);
  if (config.sql.valueMode === 'reference' && !parseVariableRef(config.sql.value)) {
    errors.push(`节点 ${node.data.label} 的 SQL 必须选择有效的上游变量`);
  }
  return errors;
}
