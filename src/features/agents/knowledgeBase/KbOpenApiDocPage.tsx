import { copyText } from './copyText';
import { Children, isValidElement, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { BookOpen, Copy, Download, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KbApiKeysDialog } from './components/KbApiKeysDialog';
import markdown from './kbOpenApiDoc.md?raw';
import './kbOpenApiDoc.css';

function nodeText(children: ReactNode): string {
  return Children.toArray(children).map((child): string => isValidElement<{ children?: ReactNode }>(child) ? nodeText(child.props.children) : String(child)).join('');
}
function headingId(children: ReactNode): string {
  return nodeText(children).toLowerCase().replace(/[^\w\u4e00-\u9fff\s-]/g, '').trim().replace(/\s+/g, '-');
}

export function KbOpenApiDocPage() {
  const container = useRef<HTMLDivElement>(null);
  const [keysOpen, setKeysOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const apiSummary = (markdown.match(/## \d+\. 接口一览表([\s\S]*?)(?=\n## |$)/)?.[1] ?? '')
    .split('\n').flatMap((line) => {
      const columns = line.split('|').map((value) => value.trim().replace(/`/g, '')).filter(Boolean);
      return /^(GET|POST|PUT|PATCH|DELETE)$/.test(columns[0] ?? '') && columns.length >= 3
        ? [{ method: columns[0], path: columns[1], description: columns[columns.length - 1] }] : [];
    });
  const headings = markdown.split('\n').flatMap((line) => {
    const match = /^(#{2,3})\s+(.+)/.exec(line);
    return match && match[2] !== '目录' ? [{ level: match[1].length, title: match[2].replace(/[#*`]/g, '').trim() }] : [];
  });
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = '知识库开放API接口文档.md'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="flex h-full min-h-0 flex-col gap-5"><header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" /></span><div><h1 className="text-lg font-semibold">知识库开放 API 文档</h1><p className="mt-1 text-xs text-muted-foreground">接口说明、鉴权方式与调用示例</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setKeysOpen(true)}><KeyRound className="size-4" />API 密钥</Button><Button variant="outline" size="sm" onClick={() => void copyText(markdown).then(() => toast.success('文档已复制')).catch(() => toast.error('复制失败'))}><Copy className="size-4" />复制文档</Button><Button variant="outline" size="sm" onClick={download}><Download className="size-4" />下载文档</Button></div></header><div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[240px_1fr]"><nav aria-label="API 文档目录" className="hidden xl:block overflow-y-auto rounded-xl border border-border bg-card p-3 space-y-1"><p className="px-3 py-2 text-xs font-semibold text-muted-foreground">文档目录</p>{headings.map((heading, index) => <Button key={index} variant={activeHeading === heading.title ? "secondary" : "ghost"} className={`h-auto w-full justify-start whitespace-normal text-left text-xs ${heading.level === 3 ? 'pl-6' : ''}`} onClick={() => { setActiveHeading(heading.title); const target = [...(container.current?.querySelectorAll('h2,h3') ?? [])].find((node) => node.textContent?.trim() === heading.title); target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{heading.title}</Button>)}</nav><article ref={container} className="min-w-0 overflow-y-auto rounded-xl border border-border bg-card p-6 text-sm leading-7 sm:p-8 [&_h1]:mb-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:scroll-mt-6 [&_h3]:font-semibold [&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/40 [&_pre]:p-4 [&_pre]:text-xs [&_pre]:leading-6 [&_code]:break-words [&_table]:my-5 [&_table]:block [&_table]:overflow-x-auto [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground"><section aria-label="接口一览" className="mb-8"><h2 className="text-lg font-semibold">接口一览</h2><p>以下路径均相对于 <code>/gpt/open/v1/kb</code>。</p><ul>{apiSummary.map((api) => <li key={`${api.method}-${api.path}`}><code>{api.method} {api.path}</code><span className="ml-3 text-muted-foreground">{api.description}</span></li>)}</ul></section><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: ({ children }) => <div className="relative"><Button variant="outline" size="xs" className="absolute right-3 top-3" onClick={() => void copyText(nodeText(children)).then(() => toast.success('代码已复制')).catch(() => toast.error('复制失败，请手动选择代码复制'))}>复制代码</Button><pre className="pt-12!">{children}</pre></div>, h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>, h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>, a: ({ href, children }) => (href?.includes('知识库API密钥管理接口文档') || href?.includes(encodeURIComponent('知识库API密钥管理接口文档'))) ? <button className="text-primary underline" onClick={() => setKeysOpen(true)}>{children}</button> : <a href={href}>{children}</a> }}>{markdown}</ReactMarkdown></article></div>{keysOpen && <KbApiKeysDialog onClose={() => setKeysOpen(false)} />}</div>;
}
