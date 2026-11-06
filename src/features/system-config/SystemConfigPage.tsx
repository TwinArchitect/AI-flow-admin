import { ImagePlus, Images, Plus, Save, Settings2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useId, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { squareAssetUrl } from '@/features/agents/agent-plaza/squareApi';
import { useAuthStore } from '@/stores/auth';
import { brandKey, getConfig, saveConfig, uploadConfigImage, type Banner, type Config } from './systemConfigApi';

function TextField({ label, value, max, onChange }: {
  label: string; value?: string; max: number; onChange: (value: string) => void;
}) {
  return <label className="grid gap-2 text-sm font-medium">
    {label}
    <Input value={value ?? ''} maxLength={max} onChange={(event) => onChange(event.target.value)} />
  </label>;
}

function ImageField({ label, value, onChange, setUploading }: {
  label: string; value?: string; onChange: (value: string) => void; setUploading: (value: boolean) => void;
}) {
  const inputId = useId();
  return <div className="space-y-3">
    <label htmlFor={inputId} className="relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary focus-within:ring-2 focus-within:ring-ring">
      {value
        ? <img src={squareAssetUrl(value)} alt={label} className="absolute inset-0 size-full object-contain" />
        : <><ImagePlus className="size-6" aria-hidden="true" />上传{label}</>}
      <input id={inputId} className="sr-only" type="file" aria-label={value ? '更换' + label : '上传' + label} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploading(true);
        try { onChange(await uploadConfigImage(file)); }
        catch (error) { toast.error((error as Error).message); }
        finally { setUploading(false); }
      }} />
    </label>
    {value && <Button type="button" variant="outline" size="sm" onClick={() => onChange('')}>清除图片</Button>}
  </div>;
}

export function SystemConfigPage() {
  const tenantId = useAuthStore((state) => state.tenantId);
  return <SystemConfigEditor key={tenantId} tenantId={tenantId} />;
}

function SystemConfigEditor({ tenantId }: { tenantId: string | null }) {
  const client = useQueryClient();
  const queryKey = ['system-config', tenantId];
  const query = useQuery({ queryKey, queryFn: getConfig, retry: false });
  const [draft, setDraft] = useState<Config>();
  const [tab, setTab] = useState('brand');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const config = draft ?? query.data;
  const busy = saving || uploading;
  const update = (patch: Partial<Config>) => setDraft((current) => ({ ...config!, ...current, ...patch }));
  const updateBanner = (id: string, patch: Partial<Banner>) => setDraft((current) => {
    const source = current ?? config!;
    return { ...source, squareBanners: source.squareBanners.map((banner) => banner.id === id ? { ...banner, ...patch } : banner) };
  });

  async function save() {
    if (!config?.appName?.trim()) {
      setTab('brand');
      toast.error('请填写产品名称');
      return;
    }
    if (config.squareBanners.some((banner) => banner.enabled && (!banner.title.trim() || !banner.imageFileId))) {
      setTab('banners');
      toast.error('启用中的广告必须填写标题并上传广告图片');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveConfig(config);
      client.setQueryData(queryKey, { ...config, ...saved, squareBanners: config.squareBanners });
      setDraft(undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: brandKey }),
        client.invalidateQueries({ queryKey: ['square-banners'] }),
      ]);
      toast.success('系统配置已保存并发布');
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  }

  function moveBanner(index: number, offset: number) {
    const next = [...config!.squareBanners];
    const target = index + offset;
    [next[index], next[target]] = [next[target], next[index]];
    update({ squareBanners: next });
  }

  return <div className="mx-auto w-full max-w-6xl space-y-4 pb-6">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings2 className="size-5" aria-hidden="true" /></span>
        <div>
        <h1 className="text-xl font-semibold">系统配置</h1>
        <p className="mt-1 text-sm text-muted-foreground">维护平台品牌、登录页文案和智能体广场轮播广告。</p>
        </div>
      </div>
      <Button disabled={!config || busy} onClick={save}><Save className="size-4" aria-hidden="true" />{saving ? '发布中…' : '保存并发布'}</Button>
    </header>
    {query.isPending && <p role="status" className="text-sm text-muted-foreground">正在加载系统配置…</p>}
    {query.isError && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
      {query.error.message}<Button variant="outline" onClick={() => void query.refetch()}>重新加载</Button>
    </div>}
    {config && <fieldset disabled={busy} aria-busy={busy} className="min-w-0">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="w-full justify-start gap-4 rounded-none border-b px-0"><TabsTrigger value="brand" className="flex-none">基础品牌</TabsTrigger><TabsTrigger value="banners" className="flex-none">广场广告（{config.squareBanners.length}）</TabsTrigger></TabsList>
        <TabsContent value="brand" className="mt-3">
          <Card className="gap-0 py-0">
            <CardContent className="grid divide-y px-0 lg:grid-cols-[minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0">
              <section className="grid content-start gap-4 p-6">
                <div>
                  <h2 className="font-semibold">产品信息</h2>
                  <p className="mt-1 text-sm text-muted-foreground">发布后同步至登录页、侧边栏和浏览器标题。</p>
                </div>
                <TextField label="产品名称（必填）" value={config.appName} max={64} onChange={(appName) => update({ appName })} />
                <TextField label="产品副标题" value={config.appIntro} max={128} onChange={(appIntro) => update({ appIntro })} />
                <TextField label="登录页底部文案" value={config.appCopyright} max={255} onChange={(appCopyright) => update({ appCopyright })} />
              </section>
              <section className="grid content-start gap-4 p-6">
                <div>
                  <h2 className="font-semibold">系统 Logo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">建议使用透明方形图片，最大 5 MB。</p>
                </div>
                <ImageField label="Logo" value={config.customLogo} onChange={(customLogo) => update({ customLogo })} setUploading={setUploading} />
                <p className="text-xs text-muted-foreground">清除图片并发布后恢复默认 Logo。</p>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="banners" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">已启用且配有图片的广告会按列表顺序轮播。</p>
            <Button variant="outline" onClick={() => update({ squareBanners: [...config.squareBanners, {
              id: crypto.randomUUID(), title: '新的广场活动', tag: '推荐应用', description: '填写活动介绍，让用户了解该智能体或解决方案。',
              actionLabel: '立即体验', actionUrl: '', actionTarget: 'internal', enabled: true, sort: config.squareBanners.length + 1,
            }] })}><Plus className="size-4" aria-hidden="true" />新增广告</Button>
          </div>
          {!config.squareBanners.length && <div className="grid justify-items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
            <Images className="mb-1 size-7 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">暂无广场广告</p>
            <p className="text-sm text-muted-foreground">智能体广场会展示内置轮播。</p>
          </div>}
          {config.squareBanners.map((banner, index) => <Card key={banner.id}>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <label className="flex items-center gap-2 text-sm"><Switch checked={banner.enabled} onCheckedChange={(enabled) => updateBanner(banner.id, { enabled })} />启用广告 {index + 1}</label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={index === 0 || busy} onClick={() => moveBanner(index, -1)}>上移</Button>
                  <Button size="sm" variant="outline" disabled={index === config.squareBanners.length - 1 || busy} onClick={() => moveBanner(index, 1)}>下移</Button>
                  <Button size="sm" variant="destructive" onClick={() => update({ squareBanners: config.squareBanners.filter((item) => item.id !== banner.id) })}>移除</Button>
                </div>
              </div>
              <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="grid gap-2">
                  <span className="text-sm font-medium">广告图片</span>
                  <ImageField label="广告图片" value={banner.imageFileId} onChange={(imageFileId) => updateBanner(banner.id, { imageFileId })} setUploading={setUploading} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="广告标题" value={banner.title} max={64} onChange={(title) => updateBanner(banner.id, { title })} />
                  <TextField label="广告标签" value={banner.tag} max={32} onChange={(tag) => updateBanner(banner.id, { tag })} />
                  <label className="grid gap-2 text-sm font-medium sm:col-span-2">广告描述
                    <Textarea value={banner.description ?? ''} rows={2} maxLength={255} onChange={(event) => updateBanner(banner.id, { description: event.target.value })} />
                  </label>
                  <TextField label="按钮文案" value={banner.actionLabel} max={24} onChange={(actionLabel) => updateBanner(banner.id, { actionLabel })} />
                  <TextField label="跳转地址" value={banner.actionUrl} max={512} onChange={(actionUrl) => updateBanner(banner.id, { actionUrl })} />
                  <label className="grid gap-2 text-sm font-medium">跳转方式
                    <Select disabled={busy} value={banner.actionTarget ?? 'external'} onValueChange={(actionTarget: 'internal' | 'external') => updateBanner(banner.id, { actionTarget })}>
                      <SelectTrigger className="w-full" aria-label="跳转方式"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="internal">站内跳转</SelectItem><SelectItem value="external">外部链接</SelectItem></SelectContent>
                    </Select>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>)}
        </TabsContent>
      </Tabs>
    </fieldset>}
  </div>;
}
