import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, MailPlus, Megaphone, RefreshCw, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { http } from '@/api/client';
import { ListPageContent, ListPageFooter, ListPageHeader, ListPageLayout } from '@/components/layout/ListPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';

type Message = {
  id: string; title: string; content: string; noticeMode: string; isSend?: boolean;
  pushTime?: string; sendTime?: string; createTime?: string; publisherName?: string;
  moduleType?: string; businessType?: string; businessId?: string;
};
type User = { id: string; username: string; nickName?: string; nickname?: string };
const base = '/gpt/auth/message';
const columns = ['标题', '类型', '计划发送', '发送状态', '发送时间', '发布人', '创建时间', '操作'];
const userName = (user: User) => user.nickName || user.nickname || user.username;
const modes = [
  { value: 'notice', label: '公告', description: '租户内广播，无需选收件人', icon: Megaphone },
  { value: 'p2p', label: '私信', description: '指定收件人发送', icon: UserRound },
] as const;

function MessageBadges({ message, status = false }: { message: Message; status?: boolean }) {
  return status
    ? <Badge variant={message.isSend ? 'success' : 'warning'}>{message.isSend ? '已发送' : '待发送'}</Badge>
    : <Badge variant={message.noticeMode === 'p2p' ? 'info' : message.noticeMode === 'notice' ? 'warning' : 'muted'}>
      {modes.find(mode => mode.value === message.noticeMode)?.label ?? '—'}
    </Badge>;
}

function SendDialog({ tenant, close, onSent }: { tenant: string | null; close: () => void; onSent: () => void }) {
  const [mode, setMode] = useState('notice');
  const [timing, setTiming] = useState('immediate');
  const [search, setSearch] = useState('');
  const [recipients, setRecipients] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);
  const scheduled = timing === 'scheduled';
  const users = useQuery({
    queryKey: ['message-recipients', tenant, search],
    enabled: mode === 'p2p',
    queryFn: async () => (await http.post<User[]>('/gpt/auth/user/query/list', search.trim() ? { name: search.trim() } : {})).data ?? [],
  });
  const field = (key: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2"><Label htmlFor={`message-${key}`}>{label}</Label><Input id={`message-${key}`} name={key} {...props} /></div>
  );
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}>
    <DialogContent className="sm:max-w-2xl" showCloseButton={!busy}>
      <DialogHeader><DialogTitle>发送消息</DialogTitle><DialogDescription>选择消息类型和发送方式</DialogDescription></DialogHeader>
      <form id="send-system-message" onSubmit={async event => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        const read = (key: string) => String(data.get(key) ?? '').trim();
        const title = read('title');
        const content = read('content');
        const pushTime = read('pushTime');
        if (!title || !content) { toast.error('标题和内容不能为空'); return; }
        if (mode === 'p2p' && !recipients.length) { toast.error('私信必须选择收件人'); return; }
        if (scheduled && !pushTime) { toast.error('定时发送请选择计划时间'); return; }
        setBusy(true);
        try {
          const result = await http.post(`${base}/save/${mode}${scheduled ? '/time' : ''}`, {
            title, content, moduleType: read('moduleType') || 'system',
            businessType: read('businessType') || undefined, businessId: read('businessId') || undefined,
            ...(scheduled ? { pushTime: pushTime.replace('T', ' ') + (pushTime.length === 16 ? ':00' : '') } : {}),
            ...(mode === 'p2p' ? { recipients: recipients.map(user => ({ recipientId: user.id, recipientName: userName(user) })) } : {}),
          });
          if (result.data === false || result.data === 0) throw new Error('消息未发送');
          toast.success(scheduled ? '消息已提交，将在计划时间送达收件人' : '消息已发送');
          onSent();
        } catch (error) { toast.error(error instanceof Error ? error.message : '发送失败'); }
        finally { setBusy(false); }
      }}>
        <fieldset disabled={busy} className="space-y-4">
          <div className="space-y-2"><Label id="message-mode-label">消息类型</Label>
            <RadioGroup value={mode} onValueChange={setMode} aria-labelledby="message-mode-label" className="grid grid-cols-2 gap-3">
              {modes.map(({ value, label, description, icon: Icon }) => <label key={value}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10">
                <RadioGroupItem value={value} className="mt-0.5" />
                <span><span className="flex items-center gap-2 text-sm font-medium"><Icon size={15} />{label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{description}</span></span>
              </label>)}
            </RadioGroup>
          </div>
          <div className="space-y-2"><Label id="message-timing-label">发送方式</Label>
            <RadioGroup value={timing} onValueChange={setTiming} aria-labelledby="message-timing-label" className="flex flex-wrap gap-3">
              {[['immediate', '立即发送'], ['scheduled', '定时发送']].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <RadioGroupItem value={value} />{label}
                </label>
              ))}
            </RadioGroup>
          </div>
          <div hidden={!scheduled}>
            {field('pushTime', '计划发送时间', { type: 'datetime-local', required: scheduled, disabled: !scheduled })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('title', '标题', { required: true, maxLength: 255, placeholder: '消息标题' })}
            {field('moduleType', '模块类型', { defaultValue: 'system' })}
          </div>
          <div className="space-y-2"><Label htmlFor="message-content">内容</Label>
            <Textarea id="message-content" name="content" required maxLength={500} rows={4} placeholder="消息正文，最多 500 字" className="resize-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('businessType', '业务类型', { placeholder: '如 ops、onboarding' })}
            {field('businessId', '业务 ID', { placeholder: '可选' })}
          </div>
          {mode === 'p2p' && <div className="space-y-2">
            <Label htmlFor="message-recipient-search">收件人</Label>
            <Input id="message-recipient-search" placeholder="搜索用户名" value={search} onChange={event => setSearch(event.target.value)} />
            <div className="max-h-48 overflow-auto rounded-lg border border-border p-3">
              {users.isPending ? <p className="text-sm text-muted-foreground">加载用户中…</p>
                : users.isError ? <p role="alert" className="text-sm text-destructive">{users.error.message}</p>
                : !users.data?.length ? <p className="text-sm text-muted-foreground">暂无用户</p>
                : users.data.map(user => <label key={user.id} className="flex cursor-pointer items-center gap-2 py-1.5 text-sm">
                  <Checkbox checked={recipients.some(item => item.id === user.id)} onCheckedChange={checked => setRecipients(previous =>
                    checked === true ? [...previous, user] : previous.filter(item => item.id !== user.id))} />
                  <span>{userName(user)}</span><span className="text-xs text-muted-foreground">{user.username}</span>
                </label>)}
            </div>
            {!!recipients.length && <p className="text-xs text-muted-foreground">已选 {recipients.length} 人：{recipients.map(user => user.username).join('、')}</p>}
          </div>}
          <p className="text-xs text-muted-foreground">消息提交后将在计划时间送达收件人，立即发送约数秒内可见。</p>
        </fieldset>
      </form>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={close}>取消</Button>
        <Button form="send-system-message" type="submit" disabled={busy}>发送</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function MessageManagementPage() {
  const tenant = useAuthStore(state => state.tenantId);
  const [query, setQuery] = useState({ pageNum: 1, pageSize: 10, title: '', noticeMode: 'all' });
  const [search, setSearch] = useState('');
  const [onlySent, setOnlySent] = useState(false);
  const [sending, setSending] = useState(false);
  const [detail, setDetail] = useState<Message | null>(null);
  const list = useQuery({
    queryKey: ['system-messages', tenant, query],
    queryFn: async () => (await http.post<{ records: Message[]; total: number }>(`${base}/query`, {
      ...query, title: query.title || undefined, noticeMode: query.noticeMode === 'all' ? undefined : query.noticeMode, isPush: true,
    })).data,
  });
  const records = (list.data?.records ?? []).filter(message => !onlySent || message.isSend);
  const total = list.data?.total ?? 0;
  return <ListPageLayout scrollMode="table">
    <ListPageHeader>
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><MailPlus size={20} /></span>
        <h1 className="text-base font-semibold">消息管理</h1>
      </header>
      <form className="flex flex-wrap items-center gap-2" onSubmit={event => {
        event.preventDefault();
        const title = search.trim();
        if (query.title === title && query.pageNum === 1) void list.refetch();
        else setQuery(previous => ({ ...previous, title, pageNum: 1 }));
      }}>
        <Input aria-label="搜索标题" placeholder="搜索标题" className="w-full sm:w-64" value={search} onChange={event => setSearch(event.target.value)} />
        <Select value={query.noticeMode} onValueChange={noticeMode => setQuery(previous => ({ ...previous, noticeMode, pageNum: 1 }))}>
          <SelectTrigger aria-label="消息类型" className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部类型</SelectItem><SelectItem value="p2p">私信</SelectItem><SelectItem value="notice">公告</SelectItem></SelectContent>
        </Select>
        <label className="flex items-center gap-2 px-2 text-sm">
          <Checkbox checked={onlySent} onCheckedChange={checked => { setOnlySent(checked === true); setQuery(previous => ({ ...previous, pageNum: 1 })); }} />仅已发送
        </label>
        <Button type="submit" size="sm" variant="outline"><Search size={14} />查询</Button>
        <Button type="button" size="sm" variant="outline" disabled={list.isFetching} onClick={() => void list.refetch()}><RefreshCw size={14} />刷新</Button>
        <Button type="button" size="sm" className="ml-auto" onClick={() => setSending(true)}><MailPlus size={14} />发送消息</Button>
      </form>
      {list.error && <p role="alert" className="text-sm text-destructive">{list.error.message}</p>}
    </ListPageHeader>
    <ListPageContent>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <Table scrollable className="min-w-[920px]" aria-label="消息列表">
          <TableHeader><TableRow>{columns.map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {records.map(message => <TableRow key={message.id}>
              <TableCell className="max-w-52 truncate font-medium" title={message.title}>{message.title}</TableCell>
              <TableCell><MessageBadges message={message} /></TableCell>
              <TableCell>{message.pushTime || '—'}</TableCell>
              <TableCell><MessageBadges message={message} status /></TableCell>
              <TableCell>{message.sendTime || '—'}</TableCell>
              <TableCell>{message.publisherName || '—'}</TableCell>
              <TableCell>{message.createTime || '—'}</TableCell>
              <TableCell><Button variant="ghost" tone="brand" size="icon-xs" title="查看详情" aria-label={`查看详情 ${message.title}`} onClick={() => setDetail(message)}><Eye size={14} /></Button></TableCell>
            </TableRow>)}
            {!records.length && <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
              {list.isPending ? '正在加载消息…' : list.isError ? '消息加载失败' : '暂无消息数据'}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </ListPageContent>
    <ListPageFooter>
      <Pagination page={query.pageNum} pageSize={query.pageSize} pageCount={Math.max(1, Math.ceil(total / query.pageSize))} total={total}
        disabled={list.isFetching} onPageChange={pageNum => setQuery(previous => ({ ...previous, pageNum }))}
        onPageSizeChange={pageSize => setQuery(previous => ({ ...previous, pageSize, pageNum: 1 }))} />
    </ListPageFooter>
    {sending && <SendDialog tenant={tenant} close={() => setSending(false)} onSent={() => { setSending(false); void list.refetch(); }} />}
    {detail && <Sheet open onOpenChange={open => { if (!open) setDetail(null); }}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader><SheetTitle>消息详情</SheetTitle><SheetDescription>查看消息内容及发送信息</SheetDescription></SheetHeader>
        <div className="min-h-0 space-y-5 overflow-y-auto px-6 pb-6">
          <div className="flex gap-2"><MessageBadges message={detail} /><MessageBadges message={detail} status /></div>
          <div><p className="text-xs text-muted-foreground">标题</p><p className="mt-1 break-words text-lg font-semibold">{detail.title}</p></div>
          <div><p className="text-xs text-muted-foreground">内容</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{detail.content}</p></div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {([['发布人', detail.publisherName], ['计划发送', detail.pushTime], ['实际发送', detail.sendTime], ['创建时间', detail.createTime],
              ['模块', detail.moduleType], ['业务类型', detail.businessType], ['业务 ID', detail.businessId]] as const).map(([label, value], index) =>
              (index < 4 || value) && <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value || '—'}</dd></div>)}
          </dl>
        </div>
      </SheetContent>
    </Sheet>}
  </ListPageLayout>;
}
