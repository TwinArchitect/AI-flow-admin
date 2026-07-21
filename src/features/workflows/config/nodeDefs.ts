import { Bot, Zap } from 'lucide-react';
import type React from 'react';
import type { WorkflowNodeDef, WorkflowNodeType } from '../types';
import { getNodeModule, REGISTERED_NODE_CATEGORIES, WORKFLOW_NODE_MODULES } from '../nodes/registry';

export const NODE_CATEGORIES = REGISTERED_NODE_CATEGORIES;
export const START_NODE_DEF = getNodeModule('start').definition;
export const END_NODE_DEF = getNodeModule('end').definition;
export const NODE_DEFS = WORKFLOW_NODE_MODULES.map((module) => module.definition);

export const NODE_DEF_MAP = Object.fromEntries(
  WORKFLOW_NODE_MODULES.map((module) => [module.type, module.definition]),
) as Record<WorkflowNodeType, WorkflowNodeDef>;

export const NODE_ICON_MAP = Object.fromEntries(
  WORKFLOW_NODE_MODULES.map((module) => [module.type, module.icon]),
) as Record<WorkflowNodeType, React.ElementType>;

export const NODE_FALLBACK_ICON = Bot;
export const NODE_STATUS_ICON = Zap;
