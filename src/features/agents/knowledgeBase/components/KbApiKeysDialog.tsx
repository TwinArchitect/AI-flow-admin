import { copyText } from '../copyText';
import { useEffect, useState } from 'react';
import { KeyRound, Plus, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { listKbApiKeys, createKbApiKey, disableKbApiKey, enableKbApiKey, deleteKbApiKey, formatKeyExpiry, type KbApiKey } from '../api/kbApiKeyApi';

function time(value?: string | null) { return value?.replace('T', ' ').slice(0, 19) || '—'; }
export function KbApiKeysDialog({ onClose }: { onClose: () => void }) {
  const [keys, setKeys] = useState<KbApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [created, setCreated] = useState<KbApiKey | null>(null);
  const [deleting, setDeleting] = useState<KbApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const load = async () => {
    setLoading(true); setError('');
    try { setKeys((await listKbApiKeys()).map((key) => ({ ...key, apiKey: undefined }))); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '密钥加载失败'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const action = async (run: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await run(); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '操作失败'); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-2xl max-h-[85dvh] rounded-xl">
    <DialogHeader className="border-b border-border pb-5 pr-6"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5" /></span><div className="space-y-2"><DialogTitle>知识库 API 密钥</DialogTitle><DialogDescription>管理外部调用凭证，完整密钥仅创建时展示一次。</DialogDescription></div></div></DialogHeader>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{loading ? '正在读取密钥…' : `共 ${keys.length} 个密钥`}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy || loading} onClick={() => void load()}><RefreshCw className="size-4" />刷新</Button><Button size="sm" disabled={busy} onClick={() => { setName(''); setExpiry(''); setCreateOpen(true); }}><Plus className="size-4" />创建密钥</Button></div></div>
    {loading ? <p>加载中…</p> : !keys.length ? <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"><span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground"><KeyRound className="size-6" /></span><p className="text-sm font-medium">暂无 API 密钥</p><p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">创建密钥后，可在外部系统中调用知识库开放 API。</p></div> : <ul className="space-y-3">{keys.map((key) => <li key={key.id} className="rounded-xl border border-border p-4 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{key.keyName || '未命名密钥'}</h3><Badge variant="secondary">{key.status === 1 ? '启用' : '禁用'}</Badge></div><code className="text-xs">{key.keyPrefix}••••••••</code><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>创建：{time(key.createTime)}</span><span>过期：{time(key.expireTime)}</span>{key.lastUsedTime && <span>最近使用：{time(key.lastUsedTime)}</span>}</div><div className="flex gap-2"><Button variant="outline" size="xs" disabled={busy} onClick={() => void action(() => key.status === 1 ? disableKbApiKey(key.id) : enableKbApiKey(key.id))}>{key.status === 1 ? '禁用' : '启用'}</Button><Button variant="outline" size="xs" disabled={busy} onClick={() => setDeleting(key)}>删除</Button></div></li>)}</ul>}
    <Dialog open={createOpen} onOpenChange={(open) => { if (!busy) setCreateOpen(open); }}><DialogContent><DialogHeader><DialogTitle>创建 API 密钥</DialogTitle><DialogDescription>为第三方系统生成调用凭证。</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Label htmlFor="kb-key-name">备注名（可选）</Label><Input id="kb-key-name" value={name} disabled={busy} onChange={(event) => setName(event.target.value)} /><Label htmlFor="kb-key-expiry">过期时间（可选，空为不过期）</Label><Input id="kb-key-expiry" type="datetime-local" value={expiry} disabled={busy} onChange={(event) => setExpiry(event.target.value)} /><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setCreateOpen(false)}>取消</Button><Button disabled={busy} onClick={() => void action(async () => { const key = await createKbApiKey({ keyName: name.trim() || undefined, expireTime: formatKeyExpiry(expiry) }); setCreateOpen(false); setName(''); setExpiry(''); setCreated(key); setCopied(false); })}>{busy ? '创建中…' : '确认创建'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(created?.apiKey)} onOpenChange={(open) => { if (!open) setCreated(null); }}><DialogContent><DialogHeader><DialogTitle>密钥创建成功</DialogTitle><DialogDescription>请立即复制并妥善保存，关闭后无法再次查看完整密钥。</DialogDescription></DialogHeader><code className="break-all select-text rounded-xl bg-muted p-4 text-sm">{created?.apiKey}</code>{error && <p className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" onClick={() => { if (created?.apiKey) void copyText(created.apiKey).then(() => setCopied(true)).catch(() => setError('复制失败，请手动选择密钥复制')); }}>{copied ? '已复制' : '复制密钥'}</Button><Button onClick={() => setCreated(null)}>我已保存，关闭</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!busy && !open) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>删除 API 密钥</DialogTitle><DialogDescription>删除后使用该密钥的调用将失效。确认删除「{deleting?.keyName || deleting?.keyPrefix}」？</DialogDescription></DialogHeader>{error && <p className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>取消</Button><Button variant="destructive" disabled={busy} onClick={() => { if (deleting) void action(async () => { await deleteKbApiKey(deleting.id); setDeleting(null); }); }}>确认删除</Button></DialogFooter></DialogContent></Dialog>
  </DialogContent></Dialog>;
}
