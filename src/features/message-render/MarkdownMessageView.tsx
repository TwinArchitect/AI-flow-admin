import { Check, Copy } from 'lucide-react';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeMarkdownSource } from './normalizeMarkdownSource';

const STREAM_THROTTLE_MS = 120;

function useThrottledValue<T>(value: T, active: boolean): T {
  const [throttled, setThrottled] = useState(value);
  const lastEmit = useRef(0);

  useEffect(() => {
    if (!active) return;
    const remaining = STREAM_THROTTLE_MS - (Date.now() - lastEmit.current);
    if (remaining <= 0) {
      lastEmit.current = Date.now();
      setThrottled(value);
      return;
    }
    const timer = window.setTimeout(() => {
      lastEmit.current = Date.now();
      setThrottled(value);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [active, value]);

  return active ? throttled : value;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission may be unavailable in embedded browsers.
    }
  };
  return (
    <div className="group relative max-w-full overflow-hidden rounded-lg border border-border bg-slate-950">
      {language ? <div className="border-b border-slate-800 px-3 py-1.5 font-mono text-[10px] uppercase text-slate-400">{language}</div> : null}
      <button type="button" onClick={() => void copy()} title="复制代码" className="absolute right-2 top-2 rounded-md bg-slate-800/80 p-1.5 text-slate-300 opacity-0 transition-opacity hover:text-white group-hover:opacity-100">
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <pre className="max-w-full overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-100"><code>{code}</code></pre>
    </div>
  );
}

const components: Components = {
  h1: ({ children }) => <h1 className="mt-2 text-xl font-bold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-2 text-lg font-bold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-1 text-base font-semibold text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold text-foreground">{children}</h4>,
  h5: ({ children }) => <h5 className="text-sm font-semibold text-foreground">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-semibold text-foreground">{children}</h6>,
  p: ({ children }) => <p className="break-words leading-relaxed [overflow-wrap:anywhere]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{children}</a>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground">{children}</blockquote>,
  hr: () => <hr className="border-border" />,
  img: ({ src, alt }) => <img src={src} alt={alt ?? '图片'} className="my-2 max-w-full rounded-lg border border-border" />,
  table: ({ children }) => <div className="max-w-full overflow-x-auto rounded-lg border border-border"><table className="w-full text-xs">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-3 py-2 align-top">{children}</td>,
  code: ({ className, children, ...props }) => {
    const text = String(children).replace(/\n$/, '');
    const language = /language-(\w+)/.exec(className ?? '')?.[1] ?? '';
    if (!language && !text.includes('\n')) {
      return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary" {...props}>{children}</code>;
    }
    return <CodeBlock code={text} language={language} />;
  },
  pre: ({ children }) => <>{children}</>,
  input: (props: ComponentPropsWithoutRef<'input'>) => props.type === 'checkbox'
    ? <input {...props} className="mr-2 align-middle" disabled />
    : <input {...props} />,
};

const MarkdownTree = memo(function MarkdownTree({ source }: { source: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{source}</ReactMarkdown>;
});

function MarkdownMessageViewImpl({ content, streaming, className = '' }: { content: string; streaming?: boolean; className?: string }) {
  const source = useThrottledValue(content, Boolean(streaming));
  const normalized = useMemo(() => normalizeMarkdownSource(source), [source]);
  if (!normalized.trim()) return null;
  return <div className={`min-w-0 max-w-full space-y-4 break-words text-sm leading-relaxed text-foreground ${className}`}><MarkdownTree source={normalized} /></div>;
}

export const MarkdownMessageView = memo(MarkdownMessageViewImpl);
