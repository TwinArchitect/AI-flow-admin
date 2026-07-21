import type { Edge, Node } from '@xyflow/react';

export type WorkflowNodeType =
  | 'start'
  | 'end'
  | 'llm'
  | 'knowledge'
  | 'http'
  | 'reply'
  | 'condition'
  | 'code'
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
  | 'datasetQuote'
  | 'dynamic'
  | 'selectDataset'
  | 'selectApp';

export interface WorkflowOutputSchema {
  key: string;
  label: string;
  valueType: WorkflowValueType | 'chatHistory';
}

export interface WorkflowVariableOption {
  ref: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: WorkflowNodeType | 'global';
  outputKey: string;
  outputLabel: string;
  valueType: WorkflowOutputSchema['valueType'];
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
  | HttpNodeConfig
  | Record<string, unknown>;

export type BackendFlowNodeType = 'workflowStart' | 'chatNode' | 'workflowEnd' | 'httpRequest468';

export interface WorkflowModuleInput {
  key: string;
  label?: string;
  valueType?: string;
  required?: boolean;
  renderTypeList?: string[];
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
