export interface WorkflowVariableRef {
  raw: string;
  nodeId: string;
  outputKey: string;
}

const VARIABLE_REF_PATTERN = /\{\{([^}.]+)\.([^}]+)\}\}/g;

export function buildVariableRef(nodeId: string, outputKey: string) {
  return `{{${nodeId}.${outputKey}}}`;
}

export function parseVariableRef(value: string): WorkflowVariableRef | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^\{\{([^}.]+)\.([^}]+)\}\}$/);
  if (!match) return null;

  return {
    raw: trimmed,
    nodeId: match[1],
    outputKey: match[2],
  };
}

export function parseVariableRefs(value: string): WorkflowVariableRef[] {
  const refs: WorkflowVariableRef[] = [];
  for (const match of value.matchAll(VARIABLE_REF_PATTERN)) {
    refs.push({
      raw: match[0],
      nodeId: match[1],
      outputKey: match[2],
    });
  }
  return refs;
}

export function stringToModuleRef(value: string): unknown {
  const parsed = parseVariableRef(value);
  if (!parsed) return value.trim();
  return [parsed.nodeId, parsed.outputKey];
}

export function moduleRefToString(value: unknown): string {
  if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'string') {
    return buildVariableRef(value[0], value[1]);
  }

  if (value == null) return '';
  return String(value);
}
