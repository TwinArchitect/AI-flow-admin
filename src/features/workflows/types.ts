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
  runStatus?: WorkflowNodeRunStatus;
  runMessage?: string;
  runStartedAt?: number;
  runDurationMs?: number;
  runInputs?: Record<string, unknown>;
  runOutputs?: Record<string, unknown>;
}

export type WorkflowCanvasNode = Node<WorkflowNodeData, WorkflowNodeType>;
export type WorkflowCanvasEdge = Edge;
export type EdgeLineMode = 'solid' | 'animated';
export type WorkflowNodeRunStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

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

export type WorkflowValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

export interface WorkflowOutputSchema {
  key: string;
  label: string;
  valueType: WorkflowValueType | 'chatHistory';
}

export interface WorkflowVariableOption {
  ref: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: WorkflowNodeType;
  outputKey: string;
  outputLabel: string;
  valueType: WorkflowOutputSchema['valueType'];
}

export interface StartNodeConfig {
  variables: StartVariable[];
  sampleInput: string;
}

export interface StartVariable {
  id: string;
  key: string;
  label: string;
  valueType: WorkflowValueType;
  required?: boolean;
  description?: string;
  defaultValue?: string;
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
  aiChatReasoning: boolean;
  aiChatTopP?: number;
}

export interface LlmNodeConfig {
  model: LlmModelValue | null;
  systemPrompt: string;
  userChatInput: string;
  history: number;
  memoryEnabled: boolean;
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

export interface HttpKeyValue {
  key: string;
  value: string;
}

export interface HttpNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  timeout: number;
  params: HttpKeyValue[];
  headers: HttpKeyValue[];
  body: string;
  captureError: boolean;
  outputField: string;
}

export type WorkflowNodeConfig =
  | StartNodeConfig
  | LlmNodeConfig
  | EndNodeConfig
  | HttpNodeConfig
  | Record<string, unknown>;

export type BackendFlowNodeType = 'workflowStart' | 'chatNode' | 'workflowEnd';

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
}

export interface WorkflowBackendPayload {
  modules: WorkflowModule[];
  edges: WorkflowCanvasEdge[];
  chatConfig: {
    variables: WorkflowChatConfigVariable[];
  };
}
