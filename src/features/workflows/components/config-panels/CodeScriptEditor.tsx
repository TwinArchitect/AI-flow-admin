import { useMemo, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { highlightCode } from '../../utils/codeSyntaxHighlight';
import { sanitizePastedText } from '../../utils/sanitizePastedText';
import { normalizeCodeSource } from '../../utils/normalizeCodeSource';
import { PromptOptimizeControl } from './shared/PromptOptimizeControl';

export function CodeScriptEditor({ value, onChange, language, agentId, inputParams, outputHint }: {
  value: string;
  onChange: (code: string) => void;
  language: 'js' | 'py';
  agentId?: string;
  inputParams?: string;
  outputHint?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <div className="relative">
      <CodeEditorSurface value={value} onChange={onChange} language={language} />
      <Button type="button" variant="ghost" size="icon-sm" className="absolute right-2 top-2 bg-background/85" aria-label="放大代码内容" onClick={() => setExpanded(true)}><Maximize2 size={14} /></Button>
    </div>
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
        <DialogHeader><DialogTitle>代码内容</DialogTitle><DialogDescription>修改会同步到节点配置，关闭后保留。</DialogDescription></DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto">
          <PromptOptimizeControl scene="code_optimize" content={value} agentId={agentId} codeLanguage={language} inputParams={inputParams} outputHint={outputHint} onApply={code => onChange(normalizeCodeSource(code, language))}>
            <div className="h-[60vh]"><CodeEditorSurface value={value} onChange={onChange} language={language} fill /></div>
          </PromptOptimizeControl>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}

function CodeEditorSurface({ value, onChange, language, fill = false }: {
  value: string;
  onChange: (code: string) => void;
  language: 'js' | 'py';
  fill?: boolean;
}) {
  const preview = useRef<HTMLPreElement>(null);
  const highlighted = useMemo(() => highlightCode(value, language), [value, language]);
  const textClass = 'm-0 w-full whitespace-pre-wrap break-words px-3 py-2 pb-10 font-mono text-xs leading-relaxed [scrollbar-gutter:stable]';
  return (
    <div className={`grid overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring ${fill ? 'h-full' : ''}`}>
      <pre ref={preview} aria-hidden className={`${textClass} pointer-events-none col-start-1 row-start-1 overflow-hidden text-foreground ${fill ? 'h-full min-h-0' : 'max-h-[28rem]'}`} dangerouslySetInnerHTML={{ __html: highlighted + '\n' }} />
      <Textarea
        aria-label="代码内容"
        value={value}
        spellCheck={false}
        onChange={event => onChange(event.target.value)}
        onScroll={event => {
          if (preview.current) {
            preview.current.scrollTop = event.currentTarget.scrollTop;
            preview.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        onPaste={event => {
          event.preventDefault();
          const { selectionStart, selectionEnd } = event.currentTarget;
          onChange(value.slice(0, selectionStart) + sanitizePastedText(event.clipboardData.getData('text/plain')) + value.slice(selectionEnd));
        }}
        className={`${textClass} col-start-1 row-start-1 border-0 bg-transparent text-transparent caret-foreground shadow-none focus-visible:ring-0 ${fill ? 'h-full min-h-0 resize-none' : 'min-h-64 max-h-[28rem] resize-y'}`}
      />
    </div>
  );
}
