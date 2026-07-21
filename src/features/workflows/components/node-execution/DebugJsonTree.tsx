import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JsonNodeProps {
  name?: string;
  value: unknown;
  depth: number;
  defaultExpanded: boolean;
}

function formatPrimitive(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function JsonNode({ name, value, depth, defaultExpanded }: JsonNodeProps) {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const entries = isObject
    ? isArray
      ? (value as unknown[]).map((item, index) => [String(index), item] as const)
      : Object.entries(value as Record<string, unknown>)
    : [];
  const [expanded, setExpanded] = useState(defaultExpanded || depth < 1);

  if (!isObject) {
    return (
      <div className="leading-5" style={{ paddingLeft: depth * 12 }}>
        {name != null && (
          <>
            <span className="text-primary">&quot;{name}&quot;</span>
            <span className="text-muted-foreground">: </span>
          </>
        )}
        <span className={cn(
          typeof value === 'string' ? 'text-success' : 'text-warning',
        )}>
          {formatPrimitive(value)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: depth > 0 ? depth * 12 : 0 }}>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start gap-0.5 rounded px-0.5 text-left hover:bg-muted"
      >
        {expanded
          ? <ChevronDown size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
          : <ChevronRight size={12} className="mt-0.5 shrink-0 text-muted-foreground" />}
        {name != null && (
          <>
            <span className="text-primary">&quot;{name}&quot;</span>
            <span className="text-muted-foreground">: </span>
          </>
        )}
        <span className="text-muted-foreground">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {expanded && (
        <div className="ml-1.5 border-l border-border">
          {entries.map(([key, child]) => (
            <JsonNode
              key={`${depth}-${key}`}
              name={isArray ? undefined : key}
              value={child}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DebugJsonSectionProps {
  title: string;
  data?: Record<string, unknown>;
  defaultOpen?: boolean;
}

export function DebugJsonSection({
  title,
  data,
  defaultOpen = true,
}: DebugJsonSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const copyText = useMemo(() => data ? JSON.stringify(data, null, 2) : '', [data]);
  const copyJson = useCallback(() => {
    if (copyText) void navigator.clipboard.writeText(copyText);
  }, [copyText]);

  if (!data || Object.keys(data).length === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-1 text-xs font-medium text-foreground"
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {title}
        </button>
        <Button variant="ghost" size="icon-sm" onClick={copyJson} aria-label={`复制${title} JSON`}>
          <Copy size={12} />
        </Button>
      </div>
      {open && (
        <div className="max-h-64 overflow-auto p-3 font-mono text-[11px]">
          <JsonNode value={data} depth={0} defaultExpanded={defaultOpen} />
        </div>
      )}
    </section>
  );
}
