import type { Edge, Node } from '@xyflow/react';

export type WorkflowNodeType =
  | 'start'
  | 'end'
  | 'llm'
  | 'knowledge'
  | 'http'
  | 'reply'
  | 'concat'
  | 'condition'
  | 'variableUpdate'
  | 'classify'
  | 'readFiles'
  | 'code'
  | 'database'
  | 'baseChart'
  | 'loop'
  | 'loopStart'
  | 'loopBreak'
  | 'plugin'
  | 'mcp';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: WorkflowNodeType;
  description: string;
  config: WorkflowNodeConfig;
}

export type WorkflowCanvasNode = Node<WorkflowNodeData, WorkflowNodeType>;
export type WorkflowCanvasEdge = Edge;
export type EdgeLineMode = 'solid' | 'animated';

export interface WorkflowNodeDef {
  type: WorkflowNodeType;
  name: string;
  description: string;
  category: string;
  tone: string;
  iconTone: string;
}

export interface WorkflowNodeCategory {
  title: string;
  items: WorkflowNodeDef[];
}

export type WorkflowValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'arrayString'
  | 'arrayNumber'
  | 'arrayBoolean'
  | 'arrayObject'
  | 'arrayAny'
  | 'file'
  | 'any'
  | 'chatHistory'
  | 'datasetQuote'
  | 'dynamic'
  | 'selectDataset'
  | 'selectApp';

export interface WorkflowOutputSchema {
  key: string;
  label: string;
  valueType: WorkflowValueType;
}

export interface WorkflowVariableOption {
  ref: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: WorkflowNodeType | 'global';
  outputKey: string;
  outputLabel: string;
  valueType: WorkflowOutputSchema['valueType'];
  scope?: 'upstream' | 'loopChild';
}

export interface StartNodeConfig {
  variables: StartVariable[];
}

export interface StartVariable {
  id: string;
  key: string;
  label: string;
  valueType: WorkflowValueType;
  required?: boolean;
  description?: string;
  defaultValue?: string;
  maxLength?: number;
  system?: boolean;
}

export interface LlmModelValue {
  id: string;
  model: string;
  type: string;
  authToken?: string;
  url?: string;
}

export interface LlmAdvancedConfig {
  temperature: number;
  maxToken: number;
  isResponseAnswerText: boolean;
  aiChatQuoteRole: string;
  quoteTemplate: string;
  quotePrompt: string;
  aiChatVision: boolean;
  aiChatAudio: boolean;
  aiChatVideo: boolean;
  aiChatExtractFiles: boolean;
  aiChatReasoning: boolean;
  aiChatTopP?: number;
}

export interface LlmNodeConfig {
  model: LlmModelValue | null;
  systemPrompt: string;
  userChatInput: string;
  history: number;
  memoryEnabled: boolean;
  multimodalEnabled: boolean;
  fileUrlRefs: string[];
  catchError: boolean;
  advanced: LlmAdvancedConfig;
}

export interface EndNodeConfig {
  outputVariables: EndOutputVariable[];
}

export interface ReplyNodeConfig {
  content: string;
}

export interface ConcatNodeConfig {
  template: string;
}

export type ConditionBranchLogic = 'AND' | 'OR';

export type ConditionOperator =
  | 'equalTo'
  | 'notEqual'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'include'
  | 'notInclude'
  | 'startWith'
  | 'endWith'
  | 'reg'
  | 'greaterThan'
  | 'greaterThanOrEqualTo'
  | 'lessThan'
  | 'lessThanOrEqualTo'
  | 'lengthEqualTo'
  | 'lengthNotEqualTo'
  | 'lengthGreaterThan'
  | 'lengthGreaterThanOrEqualTo'
  | 'lengthLessThan'
  | 'lengthLessThanOrEqualTo';

export interface ConditionRule {
  id: string;
  variableRef: string;
  condition: ConditionOperator;
  valueMode: 'input' | 'reference';
  value: string;
}

export interface ConditionBranch {
  id: string;
  condition: ConditionBranchLogic;
  rules: ConditionRule[];
}

export interface ConditionNodeConfig {
  branches: ConditionBranch[];
}

export interface VariableUpdateItem {
  id: string;
  variableRef: string;
  valueMode: 'input' | 'reference';
  value: string;
  valueType: WorkflowValueType;
}

export interface VariableUpdateNodeConfig {
  updateList: VariableUpdateItem[];
}

export interface ClassifyAgent {
  key: string;
  value: string;
}

export interface ClassifyNodeConfig {
  model: LlmModelValue | null;
  systemPrompt: string;
  history: number;
  memoryEnabled: boolean;
  userChatInput: string;
  agents: ClassifyAgent[];
}

export interface ReadFilesNodeConfig {
  filePathRefs: string[];
  smartParse: boolean;
  catchError: boolean;
}

export type DatasetSearchMode = 'embedding' | 'fullTextRecall' | 'mixedRecall';

export interface DatasetSearchSelectedItem {
  datasetId: string;
  name?: string;
  avatar?: string;
  isDeleted?: boolean;
}

export interface DatasetSearchInput {
  valueMode: 'input' | 'reference';
  value: string;
}

export interface DatasetSearchNodeConfig {
  datasets: DatasetSearchSelectedItem[];
  similarity: number;
  limit: number;
  searchMode: DatasetSearchMode;
  embeddingWeight: number;
  usingReRank: boolean;
  rerankModel: string;
  rerankWeight: number;
  searchInput: DatasetSearchInput;
  catchError: boolean;
}

export interface CodeInputVariable {
  id: string;
  key: string;
  label: string;
  value: string;
  required: boolean;
  valueType: WorkflowValueType;
}

export interface CodeOutputVariable {
  id: string;
  key: string;
  label: string;
  valueType: WorkflowValueType;
}

export interface CodeNodeConfig {
  codeType: 'js' | 'py';
  code: string;
  inputVariables: CodeInputVariable[];
  outputVariables: CodeOutputVariable[];
  catchError: boolean;
}

export type DatabaseType = 'mysql' | 'oracle' | 'kingbase';

export interface DatabaseSqlInput {
  valueMode: 'input' | 'reference';
  value: string;
}

export interface DatabaseNodeConfig {
  dbType: DatabaseType;
  databaseName: string;
  host: string;
  username: string;
  password: string;
  connectTimeout: number;
  sql: DatabaseSqlInput;
  catchError: boolean;
}

export interface BaseChartField {
  valueMode: 'input' | 'reference';
  value: string;
}

export interface BaseChartNodeConfig {
  title: BaseChartField;
  xAxis: BaseChartField;
  yAxis: BaseChartField;
  chartType: BaseChartField;
  outputChart: boolean;
  catchError: boolean;
}

export interface LoopCustomOutput {
  id: string;
  key: string;
  label: string;
  valueType: WorkflowValueType;
  value: string;
}

export interface LoopNodeConfig {
  loopRunMode: 'array';
  loopRunInputArray: string;
  customOutputs: LoopCustomOutput[];
  childrenNodeIds: string[];
  nodeWidth: number;
  nodeHeight: number;
  loopNodeInputHeight: number;
  catchError: false;
}

export interface LoopStartNodeConfig {
  loopRunMode: 'array';
  loopStartInput: string;
  loopStartIndex?: number;
}

export interface EndOutputVariable {
  id: string;
  key: string;
  value: string;
}

export interface HttpParamRow {
  id: string;
  key: string;
  type: string;
  value: string;
  required?: boolean;
}

export interface HttpInputVariable {
  id: string;
  key: string;
  label: string;
  value: string;
  required: boolean;
  valueType: WorkflowOutputSchema['valueType'];
}

export interface HttpOutputExtract {
  id: string;
  key: string;
  jsonPath: string;
  valueType: WorkflowOutputSchema['valueType'];
}

export interface HttpNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  timeout: number;
  headerSecret: Record<string, unknown> | null;
  params: HttpParamRow[];
  headers: HttpParamRow[];
  contentType: 'json' | 'form' | 'none';
  jsonBody: string;
  formBody: HttpParamRow[];
  inputVariables: HttpInputVariable[];
  outputExtracts: HttpOutputExtract[];
  catchError: boolean;
}

export type WorkflowNodeConfig =
  | StartNodeConfig
  | LlmNodeConfig
  | EndNodeConfig
  | ReplyNodeConfig
  | ConcatNodeConfig
  | ConditionNodeConfig
  | VariableUpdateNodeConfig
  | ClassifyNodeConfig
  | ReadFilesNodeConfig
  | DatasetSearchNodeConfig
  | CodeNodeConfig
  | DatabaseNodeConfig
  | BaseChartNodeConfig
  | LoopNodeConfig
  | LoopStartNodeConfig
  | HttpNodeConfig
  | Record<string, unknown>;

export type BackendFlowNodeType =
  | 'workflowStart'
  | 'chatNode'
  | 'workflowEnd'
  | 'httpRequest468'
  | 'answerNode'
  | 'textEditor'
  | 'ifElseNode'
  | 'variableUpdate'
  | 'classifyQuestion'
  | 'readFiles'
  | 'datasetSearchNode'
  | 'code'
  | 'databaseQuery'
  | 'chartVisual'
  | 'loopRun'
  | 'loopRunStart'
  | 'loopRunBreak';

export interface WorkflowModuleInput {
  key: string;
  label?: string;
  valueType?: string;
  required?: boolean;
  renderTypeList?: string[];
  selectedTypeIndex?: number;
  value?: unknown;
  debugLabel?: string;
  toolDescription?: string;
  isRichText?: boolean;
  maxLength?: number;
  max?: number;
  min?: number;
  description?: string;
  placeholder?: string;
  customInputConfig?: Record<string, unknown>;
  deprecated?: boolean;
  canEdit?: boolean;
}

export interface WorkflowModuleOutput {
  id: string;
  key: string;
  type?: string;
  valueType?: string;
  label?: string;
  description?: string;
  valueDesc?: string;
  required?: boolean;
  customFieldConfig?: Record<string, unknown>;
  invalid?: boolean;
}

export interface WorkflowModule {
  flowNodeType: BackendFlowNodeType;
  avatar?: string;
  name: string;
  intro?: string;
  version?: string;
  nodeId: string;
  inputs: WorkflowModuleInput[];
  outputs: WorkflowModuleOutput[];
  position: { x: number; y: number };
  showStatus?: boolean;
  catchError?: boolean;
  parentNodeId?: string;
}

export interface WorkflowChatConfigVariable {
  key: string;
  label: string;
  valueType: WorkflowValueType;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  maxLength?: number;
}

export interface WorkflowBackendPayload {
  modules: WorkflowModule[];
  edges: WorkflowCanvasEdge[];
  chatConfig: {
    variables: WorkflowChatConfigVariable[];
  };
}
