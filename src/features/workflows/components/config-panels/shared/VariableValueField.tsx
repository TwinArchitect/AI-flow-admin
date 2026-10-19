import { forwardRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { WorkflowVariableOption } from '../../../types';

type VariableProps = { variables: WorkflowVariableOption[] };

function VariablePreview({ value, variables, multiline, readOnly, className, children }: VariableProps & {
  value: unknown;
  multiline?: boolean;
  readOnly?: boolean;
  className?: string;
  children: (hidden: boolean) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const source = typeof value === 'string' ? value : '';
  const byRef = new Map(variables.map((variable) => [variable.ref, variable]));
  const parts = source.split(/(\{\{[^{}]+\}\})/g);
  const hasVariables = parts.some((part) => byRef.has(part));
  const showPreview = hasVariables && !editing;

  return (
    <div
      className="relative min-w-0 flex-1"
      onFocusCapture={() => { if (!readOnly) setEditing(true); }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setEditing(false);
      }}
    >
      {children(showPreview)}
      {showPreview && (
        <div className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs',
          multiline ? 'whitespace-pre-wrap break-words py-2' : 'flex items-center gap-1 whitespace-nowrap',
          className,
          'font-sans',
        )}>
          {parts.map((part, index) => {
            const variable = byRef.get(part);
            return variable ? (
              <span key={index} className="mx-0.5 inline-flex max-w-full items-center rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 align-middle text-xs font-medium text-primary">
                <span className="truncate">{variable.nodeLabel} - {variable.outputLabel}</span>
              </span>
            ) : <span key={index}>{part}</span>;
          })}
        </div>
      )}
    </div>
  );
}

export const VariableInput = forwardRef<HTMLInputElement, ComponentProps<'input'> & VariableProps>(
  ({ variables, className, ...props }, ref) => (
    <VariablePreview value={props.value} variables={variables} readOnly={props.readOnly} className={className}>
      {(hidden) => <Input ref={ref} {...props} className={cn(className, hidden && 'opacity-0')} />}
    </VariablePreview>
  ),
);
VariableInput.displayName = 'VariableInput';

export const VariableTextarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'> & VariableProps>(
  ({ variables, className, ...props }, ref) => (
    <VariablePreview value={props.value} variables={variables} readOnly={props.readOnly} className={className} multiline>
      {(hidden) => <Textarea ref={ref} {...props} className={cn(className, hidden && 'opacity-0')} />}
    </VariablePreview>
  ),
);
VariableTextarea.displayName = 'VariableTextarea';
