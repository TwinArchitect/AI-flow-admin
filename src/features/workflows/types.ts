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
  config: Record<string, unknown>;
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

export interface LlmNodeConfig {
  model: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  outputField: string;
}

export interface StartNodeConfig {
  triggerMode: 'manual' | 'webhook' | 'schedule';
  inputField: string;
  sampleInput: string;
}

export interface EndNodeConfig {
  responseTemplate: string;
  outputField: string;
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
