import type { ComponentType, ElementType } from 'react';
import type {
  BackendFlowNodeType,
  WorkflowCanvasNode,
  WorkflowCanvasEdge,
  WorkflowChatConfigVariable,
  WorkflowModule,
  WorkflowNodeConfig,
  WorkflowNodeData,
  WorkflowNodeDef,
  WorkflowNodeType,
  WorkflowOutputSchema,
  WorkflowVariableOption,
} from '../types';
import type { NodeExecutionState } from '../types/execution';

export interface NodeConnectionEdge {
  source: string;
  target: string;
}

export interface NodeConfigPanelProps {
  nodeId: string;
  config: WorkflowNodeConfig;
  variables: WorkflowVariableOption[];
  onUpdate: (patch: Record<string, unknown>) => void;
  onRemoveSourceHandle: (handleId: string) => void;
}

export interface NodeParseContext {
  variables: WorkflowChatConfigVariable[];
}

export interface NodeReferenceValue {
  value: string;
  context: string;
  acceptedValueTypes?: WorkflowOutputSchema['valueType'][];
}

export interface NodeConnectionRules {
  allowIncoming: boolean;
  allowOutgoing: boolean;
  deletable: boolean;
  requireIncoming?: boolean;
  requireOutgoing?: boolean;
  maxIncoming?: number;
  maxOutgoing?: number;
}

export interface NodeExecutionDetailsProps {
  data: WorkflowNodeData;
  execution?: NodeExecutionState;
}

export interface WorkflowNodeModule {
  type: WorkflowNodeType;
  definition: WorkflowNodeDef;
  icon: ElementType;
  backendType?: BackendFlowNodeType;
  backendRunnable: boolean;
  createDefaultConfig: () => Record<string, unknown>;
  ConfigPanel: ComponentType<NodeConfigPanelProps>;
  ExecutionDetails: ComponentType<NodeExecutionDetailsProps>;
  getOutputs: (node: WorkflowCanvasNode) => WorkflowOutputSchema[];
  getReferences: (node: WorkflowCanvasNode) => NodeReferenceValue[];
  serialize?: (node: WorkflowCanvasNode) => WorkflowModule;
  serializeChatVariables?: (node: WorkflowCanvasNode) => WorkflowChatConfigVariable[];
  parse?: (module: WorkflowModule, context: NodeParseContext) => WorkflowCanvasNode;
  validate: (node: WorkflowCanvasNode) => string[];
  validateEdges?: (
    node: WorkflowCanvasNode,
    incoming: WorkflowCanvasEdge[],
    outgoing: WorkflowCanvasEdge[],
  ) => string[];
  connection: NodeConnectionRules;
  resolveConnectionRules?: (node: WorkflowCanvasNode) => NodeConnectionRules;
  validateConnection?: (
    node: WorkflowCanvasNode,
    direction: 'incoming' | 'outgoing',
    edges: NodeConnectionEdge[],
  ) => string | null;
}
