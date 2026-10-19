import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Brain, BrainCircuit, Code2, Copy, Database, FileText, History, Loader2, MessageCircle, Paperclip, Plus, RotateCcw, Save, SendHorizontal, Settings2, Sparkles, Square, Trash2, Upload, X, Wrench } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateOpeningQuestions, exportAgentConfig, importAgentConfig, getAgent, getAgentSetting, optimizeWorkflowPrompt, publishAgent, queryAgentPublishHistory, queryAgents, rollbackAgent, updateAgent } from '../api/agentApi';
import { queryModels } from '../model-management/modelApi';
import { queryDatasets } from '../knowledgeBase/api';
import { DatasetSearchParamsDialog } from '@/features/workflows/components/config-panels/DatasetSearchParamsDialog';
import type { DatasetSearchNodeConfig } from '@/features/workflows/types';
import { buildChatAgentSettingString, DEFAULT_CHAT_PERSONA, parseChatAgentSetting, type ChatAgentConfig } from './chatAgentConfig';
import { useLayoutStore } from '@/stores/layout';
import { formatAgentEditTime } from '@/types/agent';
import { getHttpToolResource, getMcpServerResource, queryHttpToolResources, queryMcpServerResources } from './skillResourceApi';
import { saveChatGroup } from '../api/chatApi';
import { runConversationTurn } from '@/features/conversation-runtime/runConversationTurn';
import { resolveWorkflowFileType, uploadWorkflowDebugFile, type WorkflowDebugFile } from '@/features/workflows/api/workflowDebugApi';
import { ConversationMessageContent } from '@/features/message-render/ConversationMessageContent';
import { parseConversationText, resolveConversationReply } from '@/features/message-render/conversationBlocks';
import { removeTransientConversationBlocks } from '@/features/message-render/richContent';
import type { MessageBlock } from '@/types';
import { validateWorkflowUploadFile } from '@/features/workflows/utils/workflowDebugContext';
import { formatChatTime } from '@/features/agents/overview/utils/overviewMessages';
import { useAuthStore } from '@/stores/auth';
import { ChatPreviewToolMonitor, PreviewWaitingStatus, type PreviewDebugTrace, type ToolDisplayNameMap } from '@/features/conversation-runtime/ExecutionTraceMonitor';
import { VoiceMicButton } from '@/features/speech/VoiceMicButton';
import { useVoiceInput } from '@/features/speech/useVoiceInput';
import { prepareChatUploadFile } from './cameraCapture';
import { useAutoResizeTextarea } from './useAutoResizeTextarea';
import { AgentOperationsButtons } from './AgentOperationsButtons';
import { ChatAgentAvatarPicker } from './ChatAgentAvatarPicker';

type SkillPickerKind = 'http' | 'mcp' | 'workflow';
type SkillOption = { id: string; name: string; description?: string; meta?: string; toolKey?: string };
type DebugMessage = { id: string; role: 'user' | 'assistant'; content: string; blocks?: MessageBlock[]; debugTraces?: PreviewDebugTrace[]; error?: boolean; files?: WorkflowDebugFile[]; status?: string; timestamp: string };

function buildDebugFileBlocks(files: WorkflowDebugFile[]): MessageBlock[] {
  const { token, tenantId } = useAuthStore.getState();
  return files.map((file) => {
    const query = new URLSearchParams({ id: file.id });
    if (token) query.set('token', token);
    if (tenantId) query.set('tenant_id', tenantId);
    const image = resolveWorkflowFileType(file.name) === 'image';
    return { id: `attachment-${file.id}`, type: 'custom' as const, kind: 'attachment', payload: { fileId: file.id, fileName: file.name, variant: image ? 'image' : 'file', previewUrl: image ? `/gpt/file/online?${query}` : undefined, downloadUrl: `/gpt/file/download?${query}` } };
  });
}

const MAX_QUESTIONS = 10;
const MIN_QUESTIONS = 3;
function normalizeQuestions(raw: string[]) { const next = raw.slice(0, MAX_QUESTIONS).map((item) => item.slice(0, 50)); while (next.length < MIN_QUESTIONS) next.push(''); return next; }
function buildDirtySnapshot(config: ChatAgentConfig) { return buildChatAgentSettingString(config); }

function buildToolNameMap(config: ChatAgentConfig): ToolDisplayNameMap {
  const map: ToolDisplayNameMap = {};
  const put = (key?: string, label?: string) => { if (key?.trim() && label?.trim()) { map[key.trim()] = label.trim(); map[key.trim().toLowerCase()] = label.trim(); } };
  for (const [kind, items] of [['http', config.skills.httpTools], ['mcp', config.skills.mcpServers], ['workflow', config.skills.workflows]] as const) {
    for (const item of items) {
      put(item.id, item.name); put(`${kind}:${item.id}`, item.name); put(`${kind}_${item.id}`, item.name); put(`${kind}-${item.id}`, item.name); put(item.toolKey, item.name);
      if (kind === 'mcp' && 'enabledToolNames' in item) for (const tool of item.enabledToolNames ?? []) put(tool, item.name ? `${item.name} · ${tool}` : tool);
    }
  }
  return map;
}

export function ChatAgentOrchestrationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('id') ?? '';
  const updateRouteTabTitle = useLayoutStore((state) => state.updateRouteTabTitle);
  const queryKey = ['agents', 'orchestration', agentId] as const;
  const query = useQuery({ queryKey, queryFn: () => getAgentSetting(agentId), enabled: Boolean(agentId) });
  const modelsQuery = useQuery({
    queryKey: ['agents', 'orchestration', 'models'],
    queryFn: async () => {
      const page = await queryModels({ pageNum: 1, pageSize: 200, status: 0 });
      return page.records.filter((model) => model.category === 'llm' || model.category === 'multimodal' || model.type === 'llm' || model.type === 'multimodal');
    },
  });
  const initialState = useMemo(() => {
    if (!query.data) return null;
    try {
    const config = parseChatAgentSetting(query.data.agentSetting, { id: query.data.id, name: query.data.agentName, intro: query.data.remark ?? '', headImg: query.data.headImg });
    if (!query.data.agentSetting && query.data.userGuide?.trim()) config.dialogue.opening = query.data.userGuide.trim();
    return { config, error: '' };
    } catch (error) { return { config: null, error: error instanceof Error ? error.message : '智能体配置格式无效' }; }
  }, [query.data]);
  const initialConfig = initialState?.config;
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [dslBusy, setDslBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ChatAgentConfig | null>(null);
  const [knowledgePickerOpen, setKnowledgePickerOpen] = useState(false);
  const [knowledgeParamsOpen, setKnowledgeParamsOpen] = useState(false);
  const [skillPicker, setSkillPicker] = useState<SkillPickerKind | null>(null);
  const [configJsonOpen, setConfigJsonOpen] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [debugInput, setDebugInput] = useState('');
  const { textareaRef: debugInputRef } = useAutoResizeTextarea(debugInput, 6);
  const [debugGroupId, setDebugGroupId] = useState('');
  const [debugSending, setDebugSending] = useState(false);
  const debugAbortRef = useRef<AbortController | null>(null);
  const streamingAssistantIdRef = useRef<string | null>(null);
  const debugMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const debugFileInputRef = useRef<HTMLInputElement | null>(null);
  const [debugFiles, setDebugFiles] = useState<WorkflowDebugFile[]>([]);
  const [debugUploading, setDebugUploading] = useState(false);
  const debugUploadGenerationRef = useRef(0);
  const debugVoice = useVoiceInput({ value: debugInput, onChange: setDebugInput, disabled: debugSending, onError: (message) => toast.error(message) });
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishRemark, setPublishRemark] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rollbackConfirmId, setRollbackConfirmId] = useState('');
  const [aiOptimizing, setAiOptimizing] = useState<'intro_optimize' | 'persona_optimize' | 'opening_optimize' | null>(null);
  const datasetsQuery = useQuery({
    queryKey: ['agents', 'orchestration', 'datasets'],
    queryFn: () => queryDatasets({ page: 1, size: 100, status: 'ACTIVE' }),
    enabled: true,
  });
  const skillOptionsQuery = useQuery({
    queryKey: ['agents', 'orchestration', 'skill-options', skillPicker],
    enabled: skillPicker != null,
    queryFn: async (): Promise<SkillOption[]> => {
      if (skillPicker === 'http') {
        const page = await queryHttpToolResources();
        return (page.records ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description ?? undefined, meta: item.method?.toUpperCase() || undefined, toolKey: item.toolName?.trim() || undefined }));
      }
      if (skillPicker === 'mcp') {
        const page = await queryMcpServerResources();
        return (page.records ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description ?? undefined, meta: item.transport || undefined }));
      }
      const page = await queryAgents({ pageNum: 1, pageSize: 50, status: 1, flowType: 1 });
      return page.records.filter((item) => item.flowType === 1 && item.status === 1).map((item) => ({ id: item.id, name: item.agentName, description: item.remark ?? undefined, meta: '已发布' }));
    },
  });
  const historyQuery = useQuery({ queryKey: ['agents', 'publish-history', agentId], queryFn: () => queryAgentPublishHistory(agentId), enabled: historyOpen });

  useEffect(() => {
    debugUploadGenerationRef.current += 1;
    debugAbortRef.current?.abort();
    debugAbortRef.current = null;
    streamingAssistantIdRef.current = null;
    setDebugMessages([]); setDebugInput(''); setDebugFiles([]); setDebugGroupId('');
    setDebugSending(false); setDebugUploading(false);
    return () => { debugUploadGenerationRef.current += 1; debugAbortRef.current?.abort(); debugAbortRef.current = null; streamingAssistantIdRef.current = null; };
  }, [agentId]);
  useEffect(() => { if (initialConfig) { const next = { ...initialConfig, dialogue: { ...initialConfig.dialogue, openingQuestions: normalizeQuestions(initialConfig.dialogue.openingQuestions) } }; setDraft(next); setSavedSnapshot(buildDirtySnapshot(next)); } }, [initialConfig]);
  useEffect(() => {
    if (!initialConfig) return;
    let cancelled = false;
    const httpIds = initialConfig.skills.httpTools.filter((item) => !item.name || !item.toolKey).map((item) => item.id);
    const mcpIds = initialConfig.skills.mcpServers.filter((item) => !item.name).map((item) => item.id);
    const workflowIds = initialConfig.skills.workflows.filter((item) => !item.name).map((item) => item.id);
    if (!httpIds.length && !mcpIds.length && !workflowIds.length) return;
    void Promise.all([
      Promise.all(httpIds.map((id) => getHttpToolResource(id).catch(() => null))),
      Promise.all(mcpIds.map((id) => getMcpServerResource(id).catch(() => null))),
      Promise.all(workflowIds.map((id) => getAgent(id).catch(() => null))),
    ]).then(([httpDetails, mcpDetails, workflowDetails]) => {
      if (cancelled) return;
      const httpMap = new Map(httpDetails.filter((item) => item != null).map((item) => [item.id, item]));
      const mcpMap = new Map(mcpDetails.filter((item) => item != null).map((item) => [item.id, item]));
      const workflowMap = new Map(workflowDetails.filter((item) => item != null).map((item) => [item.id, item]));
      setDraft((current) => current && ({ ...current, skills: {
        ...current.skills,
        httpTools: current.skills.httpTools.map((item) => ({ ...item, name: httpMap.get(item.id)?.name || item.name, toolKey: httpMap.get(item.id)?.toolName || item.toolKey, meta: httpMap.get(item.id)?.method?.toUpperCase() || item.meta })),
        mcpServers: current.skills.mcpServers.map((item) => ({ ...item, name: mcpMap.get(item.id)?.name || item.name, meta: mcpMap.get(item.id)?.transport || item.meta })),
        workflows: current.skills.workflows.map((item) => ({ ...item, name: workflowMap.get(item.id)?.agentName || item.name })),
      } }));
    });
    return () => { cancelled = true; };
  }, [initialConfig]);
  useEffect(() => {
    const first = modelsQuery.data?.find((model) => model.isDefault === 1) ?? modelsQuery.data?.[0];
    if (!first) return;
    if (!initialConfig?.dialogue.plan?.modelId) {
      setSavedSnapshot((previous) => {
        if (!previous) return previous;
        const saved = parseChatAgentSetting(previous, { id: agentId, name: initialConfig?.basic.name ?? '', intro: initialConfig?.basic.intro ?? '' });
        return buildDirtySnapshot({ ...saved, dialogue: { ...saved.dialogue, plan: { modelId: first.id } } });
      });
    }
    setDraft((current) => {
      if (!current) return current;
      const selected = current.dialogue.plan?.modelId ? modelsQuery.data?.find((model) => model.id === current.dialogue.plan?.modelId) : first;
      if (!selected) return current;
      const plan = { modelId: selected.id, model: selected.model, type: selected.type ?? selected.category };
      if (current.dialogue.plan?.model === plan.model && current.dialogue.plan?.type === plan.type) return current;
      return { ...current, dialogue: { ...current.dialogue, plan } };
    });
  }, [agentId, initialConfig, modelsQuery.data]);
  useEffect(() => { if (query.data) updateRouteTabTitle(`/agents/orchestration?id=${agentId}`, `对话式 · ${query.data.agentName}`); }, [agentId, query.data, updateRouteTabTitle]);
  useEffect(() => { debugMessagesEndRef.current?.scrollIntoView({ behavior: debugSending ? 'smooth' : 'auto', block: 'end' }); }, [debugMessages, debugSending]);

  const saveMutation = useMutation({
    mutationFn: async (config: ChatAgentConfig) => {
      if (!config.basic.name.trim()) throw new Error('请输入智能体名称');
      if (!config.dialogue.opening.trim()) throw new Error('请输入开场白');
      if (config.dialogue.openingQuestions.filter((item) => item.trim()).length < MIN_QUESTIONS) throw new Error('请至少填写 3 个开场白问题');
      if (!config.dialogue.plan?.modelId) throw new Error('请选择规划模型');
      if (config.skills.httpTools.some((item) => !item.id?.trim())) throw new Error('HTTP 组件存在缺少 ID 的项');
      if (config.skills.mcpServers.some((item) => !item.id?.trim())) throw new Error('MCP 组件存在缺少 ID 的项');
      if (config.skills.workflows.some((item) => !item.id?.trim())) throw new Error('工作流存在缺少 ID 的项');
      if (config.skills.knowledge.datasets.some((item) => !item.datasetId?.trim())) throw new Error('知识库存在缺少 ID 的项');
      return updateAgent({ id: agentId, agentName: config.basic.name.trim(), remark: config.basic.intro.trim(), headImg: config.basic.headImg, flowType: 0, userGuide: config.dialogue.opening, agentSetting: buildChatAgentSettingString(config) });
    },
    onSuccess: async (saved, config) => { setSavedSnapshot(buildDirtySnapshot(config)); await queryClient.invalidateQueries({ queryKey }); updateRouteTabTitle(`/agents/orchestration?id=${agentId}`, `对话式 · ${saved.agentName}`); toast.success('对话式智能体配置已保存'); },
    onError: (error) => toast.error(error instanceof Error ? error.message : '保存失败'),
  });
  const publishMutation = useMutation({
    mutationFn: async () => { if (isDirty && draft) await saveMutation.mutateAsync(draft); return publishAgent(agentId, publishRemark); },
    onSuccess: async (record) => { setPublishOpen(false); setPublishRemark(''); await queryClient.invalidateQueries({ queryKey }); await queryClient.invalidateQueries({ queryKey: ['agents', 'publish-history', agentId] }); await queryClient.invalidateQueries({ queryKey: ['agents'] }); toast.success(`智能体已发布${record.version != null ? ` · v${record.version}` : ''}`); },
    onError: (error) => toast.error(error instanceof Error ? error.message : '发布失败'),
  });
  const rollbackMutation = useMutation({
    mutationFn: (publishId: string) => rollbackAgent(agentId, publishId),
    onSuccess: async () => { clearDebug(); setRollbackConfirmId(''); setHistoryOpen(false); await queryClient.invalidateQueries({ queryKey }); await queryClient.invalidateQueries({ queryKey: ['agents'] }); toast.success('已恢复至所选版本'); },
    onError: (error) => toast.error(error instanceof Error ? error.message : '版本恢复失败'),
  });


  if (!agentId) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">缺少智能体 ID</div>;
  if (query.isLoading) return <div className="flex h-full gap-4 p-5"><Skeleton className="w-72" /><Skeleton className="flex-1" /></div>;
  if (query.isError || !query.data || !draft) return <div className="flex h-full flex-col items-center justify-center gap-3"><p className="text-sm font-medium">对话式智能体加载失败</p><p className="text-xs text-muted-foreground">{initialState?.error || query.error?.message}</p><Button variant="outline" size="sm" onClick={() => void query.refetch()}>重试</Button></div>;

  const patchBasic = (value: Partial<ChatAgentConfig['basic']>) => setDraft((current) => current && ({ ...current, basic: { ...current.basic, ...value } }));
  const patchDialogue = (value: Partial<ChatAgentConfig['dialogue']>) => setDraft((current) => current && ({ ...current, dialogue: { ...current.dialogue, ...value } }));
  const optimizeText = async (scene: 'intro_optimize' | 'persona_optimize' | 'opening_optimize') => {
    if (aiOptimizing) return;
    const content = scene === 'intro_optimize' ? draft.basic.intro : scene === 'persona_optimize' ? draft.basic.persona : draft.dialogue.opening;
    if (!content.trim()) { toast.error('请先填写内容后再优化'); return; }
    setAiOptimizing(scene);
    try {
      const text = await optimizeWorkflowPrompt({ scene, content, agentId, agentName: draft.basic.name, intro: draft.basic.intro, persona: draft.basic.persona, opening: draft.dialogue.opening });
      if (scene === 'opening_optimize') patchDialogue({ opening: text });
      else patchBasic(scene === 'intro_optimize' ? { intro: text.slice(0, 200) } : { persona: text });
      toast.success('内容已优化');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'AI 优化失败'); }
    finally { setAiOptimizing(null); }
  };
  const generateQuestions = async () => {
    if (generatingQuestions) return;
    setGeneratingQuestions(true);
    try {
      const questions = await generateOpeningQuestions({ agentId, agentName: draft.basic.name, intro: draft.basic.intro, persona: draft.basic.persona, opening: draft.dialogue.opening });
      const next = normalizeQuestions(questions.map((item) => item.trim()));
      if (next.filter(Boolean).length < MIN_QUESTIONS) throw new Error('AI 未返回足够的开场白问题，请重试或手动填写');
      patchDialogue({ openingQuestions: next }); toast.success('已生成开场白问题');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'AI 生成开场白问题失败'); }
    finally { setGeneratingQuestions(false); }
  };
  const updateQuestion = (index: number, value: string) => patchDialogue({ openingQuestions: draft.dialogue.openingQuestions.map((item, itemIndex) => itemIndex === index ? value.slice(0, 50) : item) });
  const selectPlanModel = (modelId: string) => {
    const model = modelsQuery.data?.find((item) => item.id === modelId);
    patchDialogue({ plan: model ? { modelId: model.id, model: model.model, type: model.type } : null });
  };
  const patchKnowledge = (value: Partial<ChatAgentConfig['skills']['knowledge']>) => setDraft((current) => current && ({ ...current, skills: { ...current.skills, knowledge: { ...current.skills.knowledge, ...value } } }));
  const toggleDataset = (datasetId: string) => {
    const current = draft.skills.knowledge.datasets;
    const exists = current.some((item) => item.datasetId === datasetId);
    const dataset = datasetsQuery.data?.records.find((item) => item.id === datasetId);
    patchKnowledge({ datasets: exists ? current.filter((item) => item.datasetId !== datasetId) : [...current, { datasetId, name: dataset?.name }] });
  };
  const selectedSkillIds = skillPicker ? new Set(draft.skills[skillPicker === 'http' ? 'httpTools' : skillPicker === 'mcp' ? 'mcpServers' : 'workflows'].map((item) => item.id)) : new Set<string>();
  const toggleSkill = (option: SkillOption) => setDraft((current) => {
    if (!current || !skillPicker) return current;
    const key = skillPicker === 'http' ? 'httpTools' : skillPicker === 'mcp' ? 'mcpServers' : 'workflows';
    const list = current.skills[key];
    const next = list.some((item) => item.id === option.id)
      ? list.filter((item) => item.id !== option.id)
      : [...list, { ...option, ...(skillPicker === 'workflow' ? { publishedOnly: true } : {}) }];
    return { ...current, skills: { ...current.skills, [key]: next } } as ChatAgentConfig;
  });
  const removeSkill = (key: 'httpTools' | 'mcpServers' | 'workflows', id: string) => setDraft((current) => current && ({ ...current, skills: { ...current.skills, [key]: current.skills[key].filter((item) => item.id !== id) } }));
  const knowledgeParams: DatasetSearchNodeConfig = {
    ...draft.skills.knowledge,
    searchInput: { valueMode: 'input', value: '' },
    catchError: false,
  };
  const isDirty = buildDirtySnapshot(draft) !== savedSnapshot;
  const toolNameMap = buildToolNameMap(draft);
  const sendDebugMessage = async (override?: string, overrideFiles?: WorkflowDebugFile[], retryAssistantId?: string) => {
    const content = (override ?? debugInput).trim();
    const files = overrideFiles ?? debugFiles;
    if ((!content && files.length === 0) || debugSending || debugAbortRef.current) return;
    const assistantId = `assistant-${Date.now()}`;
    const controller = new AbortController();
    debugAbortRef.current = controller;
    setDebugSending(true);
    try {
      if (isDirty) {
        await saveMutation.mutateAsync(draft);
        if (controller.signal.aborted) return;
        toast.success('已自动保存配置，开始调试');
      }
      let groupId = debugGroupId;
      if (!groupId) {
        const group = await saveChatGroup(`调试-${draft.basic.name}-${Date.now()}`, agentId);
        if (controller.signal.aborted) return;
        groupId = group.id;
        setDebugGroupId(groupId);
      }
      if (controller.signal.aborted) return;
      streamingAssistantIdRef.current = assistantId;
      setDebugInput('');
      setDebugFiles([]);
      const timestamp = formatChatTime();
      setDebugMessages((current) => {
        const retryIndex = retryAssistantId ? current.findIndex((message) => message.id === retryAssistantId) : -1;
        const history = (retryIndex >= 0 ? current.slice(0, retryIndex) : current).map((message) => ({ ...message, blocks: removeTransientConversationBlocks(message.blocks ?? []) }));
        const user: DebugMessage = { id: `user-${Date.now()}`, role: 'user', content, files, blocks: buildDebugFileBlocks(files), timestamp };
        const assistant: DebugMessage = { id: assistantId, role: 'assistant', content: '', blocks: [], debugTraces: [], status: '正在连接', timestamp };
        return [...history, ...(retryAssistantId ? [] : [user]), assistant];
      });
      const { result, blocks: finalBlocks } = await runConversationTurn({
        request: { appId: agentId, chatGroupId: groupId, message: [{ role: 'user', content }], files: files.map((file) => ({ type: resolveWorkflowFileType(file.name), fileId: file.id, content: null })), debug: true },
        signal: controller.signal,
        onNodeEvent: (eventName, payload) => setDebugMessages((current) => current.map((message) => message.id === assistantId ? { ...message, status: payload.log || eventName } : message)),
        onTraces: (traces) => setDebugMessages((current) => current.map((message) => message.id === assistantId ? { ...message, debugTraces: traces } : message)),
        onBlocks: (blocks, delta) => {
          setDebugMessages((current) => current.map((message) => message.id === assistantId ? { ...message, blocks, content: delta?.kind === 'append-markdown' || delta?.kind === 'append-text' ? message.content + delta.text : message.content, status: delta ? '正在生成' : message.status } : message));
        },
        onWorkflowFinished: () => {
          if (debugAbortRef.current === controller) setDebugSending(false);
        },
      });
      if (controller.signal.aborted) return;
      setDebugMessages((current) => current.map((message) => {
        if (message.id !== assistantId) return message;
        return { ...message, blocks: finalBlocks, content: message.content || resolveConversationReply(result), status: '已完成', timestamp: formatChatTime() };
      }));
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
      const message = error instanceof Error ? error.message : '调试请求失败';
      setDebugMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: `执行失败：${message}`, blocks: parseConversationText(`**执行失败：** ${message}`, 'assistant'), error: true, status: '执行失败', timestamp: formatChatTime() } : item));
      toast.error(message);
    } finally {
      if (debugAbortRef.current === controller) {
        setDebugSending(false);
        debugAbortRef.current = null;
        streamingAssistantIdRef.current = null;
      }
    }
  };
  const exportDsl = async () => {
    setDslBusy(true);
    try { await exportAgentConfig(agentId, draft.basic.name); toast.success('配置已导出'); }
    catch (error) { toast.error(error instanceof Error ? error.message : '导出失败'); }
    finally { setDslBusy(false); }
  };
  const importDsl = async (file: File) => {
    setDslBusy(true);
    try {
      await importAgentConfig(agentId, file);
      stopDebug(); setDebugMessages([]); setDebugGroupId(''); setDebugFiles([]); setDebugInput('');
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('配置已导入');
    } catch (error) { toast.error(error instanceof Error ? error.message : '导入失败'); }
    finally { setDslBusy(false); if (importInputRef.current) importInputRef.current.value = ''; }
  };
  const stopDebug = () => { debugAbortRef.current?.abort(); debugAbortRef.current = null; const assistantId = streamingAssistantIdRef.current; if (assistantId) setDebugMessages((current) => current.map((message) => message.id === assistantId ? { ...message, blocks: [...(message.blocks ?? []), ...parseConversationText('*（已终止生成）*', 'assistant')], status: '已终止', timestamp: formatChatTime() } : message)); streamingAssistantIdRef.current = null; setDebugSending(false); };
  const clearDebug = () => { debugUploadGenerationRef.current += 1; setDebugUploading(false); stopDebug(); setDebugMessages([]); setDebugGroupId(''); setDebugInput(''); setDebugFiles([]); };
  const uploadDebugFiles = async (files: FileList | null) => {
    if (!files?.length || debugUploading || !draft.dialogue.fileUploadEnabled) return;
    const generation = debugUploadGenerationRef.current;
    setDebugUploading(true);
    try {
      const next = [...debugFiles];
      for (const rawFile of Array.from(files)) {
        const file = await prepareChatUploadFile(rawFile);
        if (generation !== debugUploadGenerationRef.current) return;
        if (next.length >= 5) { toast.warning('最多上传 5 个文件'); break; }
        const validationError = validateWorkflowUploadFile(file);
        if (validationError) { toast.error(validationError); continue; }
        const uploaded = await uploadWorkflowDebugFile(file, agentId);
        if (generation !== debugUploadGenerationRef.current) return;
        next.push(uploaded);
      }
      if (generation === debugUploadGenerationRef.current) setDebugFiles(next);
    } catch (error) { if (generation === debugUploadGenerationRef.current) toast.error(error instanceof Error ? error.message : '文件上传失败'); }
    finally { if (generation === debugUploadGenerationRef.current) { setDebugUploading(false); if (debugFileInputRef.current) debugFileInputRef.current.value = ''; } }
  };
  const regenerateDebug = (assistantId: string) => {
    const index = debugMessages.findIndex((message) => message.id === assistantId);
    const previous = index > 0 ? debugMessages[index - 1] : undefined;
    if (previous?.role !== 'user') return;
    void sendDebugMessage(previous.content, previous.files, assistantId);
  };


  return <div className="flex h-full min-h-0 flex-col bg-background">
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon-sm" onClick={() => navigate('/agents/myAgents')}><ArrowLeft /></Button><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle size={18} /></span><div><h1 className="text-sm font-bold">{draft.basic.name || '未命名智能体'}</h1><p className="text-xs text-muted-foreground">对话式智能体编排</p></div></div>
      <div className="flex items-center gap-2"><span className={`text-xs ${isDirty ? 'text-amber-500' : 'text-muted-foreground'}`}>{isDirty ? '有未保存修改' : '已保存'}</span><AgentOperationsButtons agentId={agentId} /><Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}><History size={14} />版本</Button><Button variant="outline" size="sm" disabled={dslBusy} onClick={() => void exportDsl()}>导出 DSL</Button><Button variant="outline" size="sm" disabled={dslBusy} onClick={() => importInputRef.current?.click()}>导入 DSL</Button><Button variant="outline" size="sm" onClick={() => setConfigJsonOpen(true)}><Code2 size={14} />配置 JSON</Button><Button variant="outline" size="sm" onClick={() => setPublishOpen(true)}><Upload size={14} />发布</Button><Button size="sm" disabled={saveMutation.isPending || !isDirty} onClick={() => saveMutation.mutate(draft)}>{saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saveMutation.isPending ? '保存中' : '保存'}</Button></div>
    </header>
    <main className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 overflow-y-auto bg-muted/10 p-4 xl:pr-[456px]">
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 xl:col-start-1">
        <div><h2 className="text-sm font-bold">基础信息与人设</h2><p className="mt-1 text-xs text-muted-foreground">配置智能体展示信息和回答规则。</p></div>
        <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
          <ChatAgentAvatarPicker headImg={draft.basic.headImg} onChange={(headImg) => patchBasic({ headImg })} />
          <div className="space-y-4"><div className="space-y-1.5"><Label>头像地址</Label><Input value={draft.basic.headImg} onChange={(event) => patchBasic({ headImg: event.target.value })} placeholder="输入图片 URL" /></div><div className="space-y-1.5"><Label>智能体名称 *</Label><Input value={draft.basic.name} maxLength={50} onChange={(event) => patchBasic({ name: event.target.value })} /></div></div>
        </div>
        <div className="space-y-1.5"><div className="flex items-center justify-between"><Label>智能体描述</Label><Button variant="ghost" size="sm" disabled={Boolean(aiOptimizing)} onClick={() => void optimizeText('intro_optimize')}>{aiOptimizing === 'intro_optimize' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}AI 优化</Button></div><Textarea rows={3} value={draft.basic.intro} maxLength={200} onChange={(event) => patchBasic({ intro: event.target.value })} /></div>
        <div className="space-y-1.5"><div className="flex items-center justify-between"><Label>角色提示词</Label><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => patchBasic({ persona: DEFAULT_CHAT_PERSONA })}><RotateCcw size={13} />重置模板</Button><Button variant="ghost" size="sm" disabled={Boolean(aiOptimizing)} onClick={() => void optimizeText('persona_optimize')}>{aiOptimizing === 'persona_optimize' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}AI 优化</Button></div></div><Textarea rows={14} className="font-mono text-xs leading-5" value={draft.basic.persona} onChange={(event) => patchBasic({ persona: event.target.value })} placeholder="填写角色、人设、思考和回复规范" /></div>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 xl:col-start-1">
        <div><h2 className="text-sm font-bold">对话设置</h2><p className="mt-1 text-xs text-muted-foreground">配置用户打开对话时看到的内容和可用交互。</p></div>
        <div className="space-y-1.5"><div className="flex items-center justify-between"><Label>开场白 *</Label><Button variant="ghost" size="sm" disabled={Boolean(aiOptimizing)} onClick={() => void optimizeText('opening_optimize')}>{aiOptimizing === 'opening_optimize' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}AI 优化</Button></div><Textarea rows={4} value={draft.dialogue.opening} onChange={(event) => patchDialogue({ opening: event.target.value })} /></div>
        <div className="space-y-3"><div className="flex items-start justify-between gap-3"><div><Label>开场白问题 *</Label><p className="mt-1 text-xs text-muted-foreground">至少填写 3 个，最多 10 个，每个不超过 50 字。</p></div><Button variant="ghost" size="sm" disabled={generatingQuestions} onClick={() => void generateQuestions()}>{generatingQuestions ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}AI 生成</Button></div>
          {draft.dialogue.openingQuestions.map((question, index) => <div key={index} className="flex items-center gap-2"><Input value={question} maxLength={50} onChange={(event) => updateQuestion(index, event.target.value)} placeholder={`开场问题 ${index + 1}`} /><span className="w-10 text-right text-2xs text-muted-foreground">{question.length}/50</span>{draft.dialogue.openingQuestions.length > MIN_QUESTIONS && <Button variant="ghost" size="icon-sm" onClick={() => patchDialogue({ openingQuestions: draft.dialogue.openingQuestions.filter((_, itemIndex) => itemIndex !== index) })}><X size={14} /></Button>}</div>)}
          <Button variant="outline" size="sm" disabled={draft.dialogue.openingQuestions.length >= MAX_QUESTIONS} onClick={() => patchDialogue({ openingQuestions: [...draft.dialogue.openingQuestions, ''] })}><Plus size={14} />新增问题</Button>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border">
          <div className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-medium">文件上传</p><p className="mt-1 text-xs text-muted-foreground">允许用户在对话中上传文件供智能体处理。</p></div><Switch checked={draft.dialogue.fileUploadEnabled} onCheckedChange={(fileUploadEnabled) => patchDialogue({ fileUploadEnabled })} /></div>
          <div className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-medium">猜你想问</p><p className="mt-1 text-xs text-muted-foreground">回复后自动提供问题建议。</p></div><Switch checked={draft.dialogue.autoFollowUp} onCheckedChange={(autoFollowUp) => patchDialogue({ autoFollowUp })} /></div>
        </div>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 xl:col-start-1">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><BrainCircuit size={18} /></span><div><h2 className="text-sm font-bold">规划模型与高级参数</h2><p className="mt-1 text-xs text-muted-foreground">选择模型，并控制工具调用轮数和生成策略。</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>规划模型 *</Label><Select value={draft.dialogue.plan?.modelId ?? ''} onValueChange={selectPlanModel}><SelectTrigger><SelectValue placeholder={modelsQuery.isLoading ? '加载模型中...' : '选择模型'} /></SelectTrigger><SelectContent>{(modelsQuery.data ?? []).map((model) => <SelectItem key={model.id} value={model.id}>{model.name || model.model}{(model.type ?? model.category) === 'multimodal' ? ' · 多模态' : ''}</SelectItem>)}</SelectContent></Select><p className="text-2xs text-muted-foreground">数据来自模型管理接口，仅展示当前已启用的语言及多模态模型。</p>{modelsQuery.isError && <p className="text-xs text-destructive">模型列表加载失败</p>}{!modelsQuery.isLoading && !modelsQuery.isError && modelsQuery.data?.length === 0 && <p className="text-xs text-amber-500">模型中心暂无已启用的 LLM 或多模态模型</p>}</div>
          <div className="space-y-1.5"><Label>maxToolRounds</Label><Input type="number" min={1} max={32} value={draft.dialogue.maxToolRounds} onChange={(event) => patchDialogue({ maxToolRounds: Math.min(32, Math.max(1, Number(event.target.value) || 1)) })} /><p className="text-2xs text-muted-foreground">最多工具调用轮数，范围 1–32。</p></div>
          <div className="space-y-1.5"><Label>toolChoice</Label><Select value={draft.dialogue.toolChoice} onValueChange={(toolChoice) => patchDialogue({ toolChoice: toolChoice as ChatAgentConfig['dialogue']['toolChoice'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">auto · 自动决定</SelectItem><SelectItem value="none">none · 禁用工具</SelectItem><SelectItem value="required">required · 必须调用</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label>temperature</Label><Input type="number" min={0} max={2} step={0.1} value={draft.dialogue.temperature} onChange={(event) => patchDialogue({ temperature: Math.min(2, Math.max(0, Number(event.target.value) || 0)) })} /><p className="text-2xs text-muted-foreground">生成随机性，范围 0–2。</p></div>
          <div className="space-y-1.5"><Label>maxTokens</Label><Input type="number" min={1} step={256} value={draft.dialogue.maxTokens} onChange={(event) => patchDialogue({ maxTokens: Math.max(1, Number(event.target.value) || 1) })} /><p className="text-2xs text-muted-foreground">单次回复最大 Token 数。</p></div>
        </div>
      </section>
      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:fixed xl:bottom-4 xl:right-5 xl:top-[8rem] xl:z-10 xl:w-[420px] xl:min-h-0">
        <div className="flex items-center justify-between border-b border-border/70 bg-background/80 px-4 py-3.5 backdrop-blur"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle size={18} /></span><div><h2 className="text-sm font-semibold">调试预览</h2><p className="mt-0.5 text-[11px] text-muted-foreground">实时验证当前智能体效果</p></div></div><Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearDebug}><Trash2 size={14} />清空</Button></div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-muted/20 p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{debugMessages.length === 0 && <div className="m-auto max-w-[290px] text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={22} /></div><p className="mt-3 text-sm font-medium leading-6">{draft.dialogue.opening}</p><div className="mt-4 flex flex-wrap justify-center gap-2">{draft.dialogue.openingQuestions.filter(Boolean).map((question) => <Button key={question} variant="outline" size="sm" className="rounded-full bg-background" disabled={debugSending} onClick={() => void sendDebugMessage(question)}>{question}</Button>)}</div></div>}{debugMessages.map((message) => <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>{message.role === 'user' ? '我' : <Sparkles size={13} />}</span><div className="group min-w-0 max-w-[85%]"><div className={`min-w-0 space-y-2 overflow-hidden rounded-md border px-3 py-2 text-xs leading-relaxed [overflow-wrap:anywhere] ${message.role === 'user' ? 'border-primary bg-primary text-primary-foreground' : message.error ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-muted/60 text-foreground'}`}>{message.role === 'assistant' && <ChatPreviewToolMonitor traces={message.debugTraces ?? []} toolNameMap={toolNameMap} compact />}<PreviewWaitingStatus active={debugSending && message.id === streamingAssistantIdRef.current && !message.content} traces={message.debugTraces ?? []} /><ConversationMessageContent role={message.role} blocks={message.blocks?.length ? message.blocks : parseConversationText(message.content, message.role)} streaming={debugSending && message.id === streamingAssistantIdRef.current && !message.error} onSuggestedQuestionClick={(question) => void sendDebugMessage(question)} /></div>{message.role === 'assistant' && message.content && <div className="mt-1 flex items-center gap-1 text-muted-foreground"><Button variant="ghost" size="icon-xs" onClick={() => void navigator.clipboard.writeText(message.content)} aria-label="复制回复"><Copy size={12} /></Button><Button variant="ghost" size="icon-xs" disabled={debugSending} onClick={() => regenerateDebug(message.id)} aria-label="重新生成"><RotateCcw size={12} /></Button>{message.status && <span className="text-2xs">{message.status}</span>}<span className="ml-auto text-2xs">{message.timestamp}</span></div>}</div></div>)}<div ref={debugMessagesEndRef} /></div>
        <div className="shrink-0 space-y-2 border-t border-border bg-card p-4">{debugFiles.length > 0 && <div className="flex flex-wrap gap-2">{debugFiles.map((file) => <span key={file.id} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground"><FileText size={11} /><span className="max-w-40 truncate">{file.name}</span><button type="button" onClick={() => setDebugFiles((current) => current.filter((item) => item.id !== file.id))}><X size={11} /></button></span>)}</div>}<input ref={debugFileInputRef} type="file" multiple className="sr-only" onChange={(event) => void uploadDebugFiles(event.target.files)} /><div className="flex items-end gap-2 rounded-md border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30">{draft.dialogue.fileUploadEnabled && <Button variant="ghost" size="icon-sm" disabled={debugSending || debugUploading} onClick={() => debugFileInputRef.current?.click()} aria-label="上传附件">{debugUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}</Button>}<Textarea ref={debugInputRef} rows={1} value={debugInput} disabled={debugSending} onChange={(event) => setDebugInput(event.target.value)} onKeyDown={(event) => { if (event.nativeEvent.isComposing) return; if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (debugVoice.listening) void debugVoice.stop(); void sendDebugMessage(); } }} className="max-h-28 min-h-9 flex-1 resize-none rounded-none !border-0 !bg-transparent px-1 py-2 !shadow-none focus-visible:ring-0" placeholder={debugVoice.listening ? '正在识别…' : '输入调试问题，Enter 发送'} readOnly={debugVoice.listening} /><VoiceMicButton voice={debugVoice} disabled={debugSending} iconSize={16} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" />{debugSending ? <Button variant="destructive" size="icon-sm" onClick={stopDebug} aria-label="终止生成"><Square size={13} fill="currentColor" /></Button> : <Button size="icon-sm" disabled={!debugInput.trim() && debugFiles.length === 0} onClick={() => void sendDebugMessage()} aria-label="发送调试问题"><SendHorizontal size={15} /></Button>}</div>{isDirty && <p className="text-[11px] text-amber-500">发送前将自动保存当前配置</p>}</div>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 xl:col-start-1">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><Brain size={18} /></span><div><h2 className="text-sm font-bold">记忆</h2><p className="mt-1 text-xs text-muted-foreground">控制长期记忆存储和每次对话携带的历史上下文。</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">长期记忆</p><p className="mt-1 text-xs text-muted-foreground">总结聊天内容并用于后续回答。</p></div><Switch checked={draft.memory.longTermMemory} onCheckedChange={(longTermMemory) => setDraft((current) => current && ({ ...current, memory: { ...current.memory, longTermMemory, memoryDatasetId: longTermMemory ? current.memory.memoryDatasetId : undefined } }))} /></div>{draft.memory.longTermMemory && <div className="space-y-1.5"><Label>记忆库（可选）</Label><Select value={draft.memory.memoryDatasetId ?? ''} onValueChange={(memoryDatasetId) => setDraft((current) => current && ({ ...current, memory: { ...current.memory, memoryDatasetId } }))}><SelectTrigger><SelectValue placeholder="选择用于长期记忆的知识库" /></SelectTrigger><SelectContent>{(datasetsQuery.data?.records ?? []).map((dataset) => <SelectItem key={dataset.id} value={dataset.id}>{dataset.name}</SelectItem>)}</SelectContent></Select></div>}</div>
          <div className="space-y-3 rounded-xl border border-border p-4"><div><p className="text-sm font-medium">短期记忆</p><p className="mt-1 text-xs text-muted-foreground">控制每次对话携带的历史上下文轮数，范围 0–50。</p></div><div className="flex items-center gap-3"><Input type="number" min={0} max={50} value={draft.memory.contextRounds} onChange={(event) => setDraft((current) => current && ({ ...current, memory: { ...current.memory, contextRounds: Math.min(50, Math.max(0, Number(event.target.value) || 0)) } }))} /><span className="shrink-0 text-xs text-muted-foreground">轮</span></div></div>
        </div>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 xl:col-start-1">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><Database size={18} /></span><div><h2 className="text-sm font-bold">知识库能力</h2><p className="mt-1 text-xs text-muted-foreground">绑定知识库，并配置召回、过滤和结果重排策略。</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setKnowledgeParamsOpen(true)}><Settings2 size={14} />检索参数</Button><Button size="sm" onClick={() => setKnowledgePickerOpen(true)}><Plus size={14} />选择知识库</Button></div></div>
        <div className="flex flex-wrap items-center gap-3"><Label>retrievalMode</Label><Select value={draft.skills.knowledge.retrievalMode} onValueChange={(retrievalMode) => patchKnowledge({ retrievalMode: retrievalMode as ChatAgentConfig['skills']['knowledge']['retrievalMode'] })}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tool">tool · 作为工具调用</SelectItem><SelectItem value="always">always · 每次检索</SelectItem><SelectItem value="auto">auto · 自动判断</SelectItem></SelectContent></Select><span className="text-xs text-muted-foreground">{draft.skills.knowledge.searchMode} · 阈值 {draft.skills.knowledge.similarity.toFixed(2)} · 上限 {draft.skills.knowledge.limit}{draft.skills.knowledge.usingReRank ? ` · Rerank ${draft.skills.knowledge.rerankModel || '未选择'}` : ''}</span></div>
        <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-border bg-muted/20 p-3">{draft.skills.knowledge.datasets.length ? draft.skills.knowledge.datasets.map((item) => <Badge key={item.datasetId} variant="secondary" className="gap-1.5 py-1.5">{item.name || item.datasetId}<button type="button" aria-label="移除知识库" onClick={() => toggleDataset(item.datasetId)}><X size={12} /></button></Badge>) : <span className="text-xs text-muted-foreground">尚未绑定知识库</span>}</div>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 xl:col-start-1">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Wrench size={18} /></span><div><h2 className="text-sm font-bold">工具与技能</h2><p className="mt-1 text-xs text-muted-foreground">绑定 HTTP 工具、MCP 服务和已发布工作流。</p></div></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {([['http', 'HTTP 组件', '调用插件中心已启用的 HTTP 工具', 'httpTools'], ['mcp', 'MCP 组件', '接入 MCP 服务，可限制服务内工具名称', 'mcpServers'], ['workflow', '工作流', '仅绑定已发布工作流', 'workflows']] as const).map(([kind, title, description, key]) => <div key={kind} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Button variant="outline" size="sm" onClick={() => setSkillPicker(kind)}><Plus size={14} />添加</Button></div><div className="mt-3 flex min-h-9 flex-wrap gap-2">{draft.skills[key].length ? draft.skills[key].map((item) => <Badge key={item.id} variant="secondary" className="gap-1.5 py-1.5">{item.name || item.id}{item.meta ? ` · ${item.meta}` : ''}<button type="button" onClick={() => removeSkill(key, item.id)}><X size={12} /></button></Badge>) : <span className="text-xs text-muted-foreground">尚未绑定</span>}</div>{kind === 'mcp' && draft.skills.mcpServers.map((server) => <div key={server.id} className="mt-3 space-y-1.5"><Label>{server.name || server.id} · enabledToolNames</Label><Input value={(server.enabledToolNames ?? []).join(',')} onChange={(event) => { const enabledToolNames = event.target.value.split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean); setDraft((current) => current && ({ ...current, skills: { ...current.skills, mcpServers: current.skills.mcpServers.map((item) => item.id === server.id ? { ...item, enabledToolNames: enabledToolNames.length ? enabledToolNames : undefined } : item) } })); }} placeholder="留空表示使用服务内已启用工具" /></div>)}</div>)}
          <div className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-medium">Skills <Badge variant="outline">即将推出</Badge></p><p className="mt-1 text-xs text-muted-foreground">接入可复用的技能包，扩展智能体专业能力。</p></div><Button variant="outline" size="sm" onClick={() => toast.warning('Skills 能力后续接入')}><Plus size={14} />添加</Button></div></div>
        </div>
      </section>
    </main>
    <input ref={importInputRef} type="file" accept=".yml,.yaml" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importDsl(file); }} />
    <Dialog open={knowledgePickerOpen} onOpenChange={setKnowledgePickerOpen}><DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>选择知识库</DialogTitle><DialogDescription>可多选当前租户中已启用的知识库。</DialogDescription></DialogHeader><div className="space-y-2 py-2">{datasetsQuery.isLoading && <div className="py-8 text-center text-xs text-muted-foreground">加载中...</div>}{datasetsQuery.isError && <div className="py-8 text-center text-xs text-destructive">知识库加载失败</div>}{datasetsQuery.data?.records.map((dataset) => { const checked = draft.skills.knowledge.datasets.some((item) => item.datasetId === dataset.id); return <button type="button" key={dataset.id} onClick={() => toggleDataset(dataset.id)} className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left hover:border-primary/40"><Checkbox checked={checked} /><span className="min-w-0"><span className="block text-sm font-medium">{dataset.name}</span><span className="mt-1 block text-xs text-muted-foreground">{dataset.description || '暂无描述'} · {dataset.documentCount ?? 0} 文档</span></span></button>; })}</div></DialogContent></Dialog>
    <Dialog open={skillPicker != null} onOpenChange={(open) => !open && setSkillPicker(null)}><DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>选择{skillPicker === 'http' ? ' HTTP 组件' : skillPicker === 'mcp' ? ' MCP 组件' : '工作流'}</DialogTitle><DialogDescription>{skillPicker === 'workflow' ? '仅展示已发布的工作流型智能体。' : '可多选当前租户中已启用的资源。'}</DialogDescription></DialogHeader><div className="space-y-2 py-2">{skillOptionsQuery.isLoading && <div className="py-8 text-center text-xs text-muted-foreground">加载中...</div>}{skillOptionsQuery.isError && <div className="py-8 text-center text-xs text-destructive">资源加载失败</div>}{skillOptionsQuery.data?.map((option) => <button type="button" key={option.id} onClick={() => toggleSkill(option)} className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left hover:border-primary/40"><Checkbox checked={selectedSkillIds.has(option.id)} /><span className="min-w-0"><span className="block text-sm font-medium">{option.name}</span><span className="mt-1 block text-xs text-muted-foreground">{option.description || '暂无描述'}{option.meta ? ` · ${option.meta}` : ''}</span></span></button>)}</div></DialogContent></Dialog>
    <Dialog open={configJsonOpen} onOpenChange={setConfigJsonOpen}><DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl"><DialogHeader><DialogTitle>对话式智能体配置 JSON</DialogTitle><DialogDescription>当前编辑态的完整配置，保存后写入 agentSetting。</DialogDescription></DialogHeader><pre className="max-h-[65vh] overflow-auto rounded-xl bg-muted p-4 text-xs leading-5">{JSON.stringify(draft, null, 2)}</pre></DialogContent></Dialog>
    <Dialog open={publishOpen} onOpenChange={(open) => !publishMutation.isPending && setPublishOpen(open)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>发布智能体</DialogTitle><DialogDescription>将当前配置发布为正式版本；未保存修改会先自动保存。</DialogDescription></DialogHeader><div className="space-y-1.5"><Label>发布说明（可选）</Label><Textarea rows={3} value={publishRemark} onChange={(event) => setPublishRemark(event.target.value)} placeholder="例如：首次上线、优化对话逻辑" /></div><div className="flex justify-end gap-2"><Button variant="outline" disabled={publishMutation.isPending} onClick={() => setPublishOpen(false)}>取消</Button><Button disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>{publishMutation.isPending && <Loader2 size={14} className="animate-spin" />}确认发布</Button></div></DialogContent></Dialog>
    <Dialog open={historyOpen} onOpenChange={(open) => !rollbackMutation.isPending && setHistoryOpen(open)}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>版本管理</DialogTitle><DialogDescription>查看发布历史，并恢复至任意正式版本。</DialogDescription></DialogHeader>{historyQuery.isLoading && <div className="py-12 text-center text-sm text-muted-foreground">加载发布历史...</div>}{historyQuery.isError && <div className="py-12 text-center text-sm text-destructive">发布历史加载失败</div>}{historyQuery.data?.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">暂无发布记录</div>}<div className="space-y-3">{historyQuery.data?.map((record, index) => <div key={record.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-sm font-bold">v{record.version ?? '-'}</span>{index === 0 && <Badge>最新</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{formatAgentEditTime(record.publishTime ?? record.createTime)}</p>{record.publishRemark && <p className="mt-2 text-xs">{record.publishRemark}</p>}</div>{rollbackConfirmId !== record.id && <Button variant="ghost" size="sm" disabled={rollbackMutation.isPending} onClick={() => setRollbackConfirmId(record.id)}><RotateCcw size={13} />恢复</Button>}</div>{rollbackConfirmId === record.id && <div className="mt-3 rounded-lg bg-amber-500/10 p-3"><p className="text-xs text-amber-600">恢复后当前未保存编辑会丢失，确认恢复至 v{record.version ?? '-'}？</p><div className="mt-2 flex gap-2"><Button size="sm" disabled={rollbackMutation.isPending} onClick={() => rollbackMutation.mutate(record.id)}>{rollbackMutation.isPending && <Loader2 size={13} className="animate-spin" />}确认恢复</Button><Button variant="ghost" size="sm" onClick={() => setRollbackConfirmId('')}>取消</Button></div></div>}</div>)}</div></DialogContent></Dialog>
    <DatasetSearchParamsDialog open={knowledgeParamsOpen} config={knowledgeParams} onOpenChange={setKnowledgeParamsOpen} onConfirm={(params) => patchKnowledge(params)} />
  </div>;
}
