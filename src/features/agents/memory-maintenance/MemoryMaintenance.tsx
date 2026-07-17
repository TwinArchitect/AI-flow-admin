import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Database,
  FileText,
  LayoutGrid,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ExtractionResult, ImportanceLevel, MemoryCategory, MemoryItem, RecallResult } from './types';
import { categoryLabel, formatDate } from './utils';
import {
  createMemory,
  deleteMemory,
  extractMemories,
  initialMemories,
  queryMemories,
  recallMemories,
  toggleMemoryStatus,
  updateMemory,
} from './memoryApi';

// ====== Tab 类型 ======

type TabKey = 'archive' | 'extraction' | 'simulation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'archive', label: '记忆档案库' },
  { key: 'extraction', label: '认知提取 (Pipeline)' },
  { key: 'simulation', label: '记忆测试 (Simulation)' },
];

// ====== 智能体列表 ======

const AGENT_OPTIONS = [
  '锅炉安全诊断专家',
  '汽轮机运维助手',
  '系统集成助手',
  '安全研判智能体',
  '环保指标专家',
  '全系统通用型全局记忆',
];

// ====== 页面组件 ======

export default function MemoryMaintenance() {
  // 主数据
  const [memories, setMemories] = useState<MemoryItem[]>(initialMemories);
  const [loading, setLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>('archive');

  // 筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | 'all'>('all');
  const [importanceFilter, setImportanceFilter] = useState<ImportanceLevel | 'all'>('all');

  // 弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMemory, setEditMemory] = useState<MemoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // 表单
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<MemoryCategory>('preference');
  const [formAgentName, setFormAgentName] = useState(AGENT_OPTIONS[0]);
  const [formImportance, setFormImportance] = useState<ImportanceLevel>('medium');
  const [formTags, setFormTags] = useState('');

  // 认知提取
  const [transcript, setTranscript] = useState(
    '用户：小智，记录一下。1号超超临界锅炉下次临检计划调整至十月第二周，另外以后回答我类似规范问题时，请先输出思维导图结构，表格形式次之。\n智能体：好的，已为您添加认知追踪。下一次1号锅炉临检将在10月第二周。您的偏好调整为优先思维导图，我会牢记这个交互习惯。',
  );
  const [extractedItems, setExtractedItems] = useState<ExtractionResult[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // 召回测试
  const [recallQuery, setRecallQuery] = useState(
    '我想分析一下1号超超临界锅炉最近过热器的异常警报情况',
  );
  const [recallThreshold] = useState(0.45);
  const [recallModel, setRecallModel] = useState('bge-large-zh-v1.5 (Cosine)');
  const [recallTopK, setRecallTopK] = useState(3);
  const [recalledList, setRecalledList] = useState<RecallResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // ====== 加载数据 ======

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await queryMemories({
        search: searchQuery || undefined,
        category: categoryFilter,
        importance: importanceFilter,
      });
      setMemories(result);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, importanceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ====== 统计 ======

  const totalCount = memories.length;
  const activeCount = memories.filter((m) => m.status === 'active').length;
  const criticalCount = memories.filter(
    (m) => m.importance === 'critical' && m.status === 'active',
  ).length;
  const totalRecallCount = memories.reduce((acc, m) => acc + m.hitCount, 0);

  // ====== 操作 ======

  const handleToggleStatus = async (id: string) => {
    const result = await toggleMemoryStatus(id);
    if (result) loadData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条记忆记录吗？删除后智能体在生成式召回中将无法获取该事实。'))
      return;
    await deleteMemory(id);
    loadData();
  };

  const openCreate = () => {
    setEditMemory(null);
    setFormContent('');
    setFormCategory('preference');
    setFormAgentName(AGENT_OPTIONS[0]);
    setFormImportance('medium');
    setFormTags('');
    setIsModalOpen(true);
  };

  const openEdit = (mem: MemoryItem) => {
    setEditMemory(mem);
    setFormContent(mem.content);
    setFormCategory(mem.category);
    setFormAgentName(mem.agentName);
    setFormImportance(mem.importance);
    setFormTags(mem.tags.join(', '));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formContent.trim()) {
      alert('请输入记忆实体内容！');
      return;
    }
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSaving(true);
    try {
      const payload = {
        content: formContent.trim(),
        category: formCategory,
        agentName: formAgentName,
        importance: formImportance,
        tags: tagsArray,
      };
      if (editMemory) {
        await updateMemory(editMemory.id, payload);
      } else {
        await createMemory(payload);
      }
      setIsModalOpen(false);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  // ====== 认知提取 ======

  const runExtraction = async () => {
    if (!transcript.trim()) return;
    setIsExtracting(true);
    try {
      const results = await extractMemories(transcript);
      setExtractedItems(results);
    } finally {
      setIsExtracting(false);
    }
  };

  const mergeExtracted = async (item: ExtractionResult) => {
    await createMemory({
      content: item.fact,
      category: item.type,
      agentName: AGENT_OPTIONS[0],
      importance: 'high',
      tags: ['自动提取', '实时感知'],
    });
    setExtractedItems((prev) => prev.filter((i) => i.id !== item.id));
    loadData();
  };

  // ====== 召回测试 ======

  const runSimulation = async () => {
    if (!recallQuery.trim()) return;
    setIsSimulating(true);
    try {
      const results = await recallMemories(recallQuery, recallThreshold, recallModel, recallTopK);
      setRecalledList(results);
    } finally {
      setIsSimulating(false);
    }
  };

  // ====== 分类筛选列表 ======

  const categoryFilters: { id: MemoryCategory | 'all'; label: string; count: number }[] = [
    { id: 'all', label: '全部记忆', count: memories.length },
    {
      id: 'preference',
      label: '用户偏好习惯',
      count: memories.filter((m) => m.category === 'preference').length,
    },
    {
      id: 'fact',
      label: '系统运维事实',
      count: memories.filter((m) => m.category === 'fact').length,
    },
    {
      id: 'episodic',
      label: '历史会话摘要',
      count: memories.filter((m) => m.category === 'episodic').length,
    },
    {
      id: 'behavior',
      label: '交互行为特征',
      count: memories.filter((m) => m.category === 'behavior').length,
    },
  ];

  const importanceFilters: { id: ImportanceLevel | 'all'; label: string }[] = [
    { id: 'all', label: '完全等级' },
    { id: 'critical', label: '非常严重 (Critical)' },
    { id: 'high', label: '优先级别 (High)' },
    { id: 'medium', label: '普通等级 (Medium)' },
    { id: 'low', label: '次要说明 (Low)' },
  ];

  // ====== 渲染 ======

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="space-y-6 pb-10">
        {/* ====== Tab 切换 ====== */}
        <div className="flex flex-col gap-3 pb-6 border-b border-line">
          <div className="flex gap-2 p-1 bg-muted rounded-2xl w-fit">
            {TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="rounded-xl"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'archive' && (
            <p className="text-xs text-fg-muted leading-relaxed max-w-3xl pl-1">
              平台的认知中枢，用于对智能体的长期记忆和用户认知进行统一管理。持续积累用户偏好、业务习惯与历史交互，从而达到更精准、个性化的智能服务。
            </p>
          )}
        </div>

        {/* ====== Tab 1: 记忆档案库 ====== */}
        {activeTab === 'archive' && (
          <div className="flex flex-col gap-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                icon={Brain}
                label="总记忆实体项"
                value={totalCount}
                unit="个档案"
                desc="支持系统级与智能体级持久记忆"
                accent="primary"
              />
              <StatCard
                icon={CheckCircle}
                label="激活使用中"
                value={activeCount}
                unit="个"
                desc={`生效中的长远认知记忆单元比例 ${((activeCount / Math.max(1, totalCount)) * 100).toFixed(0)}%`}
                accent="success"
              />
              <StatCard
                icon={Activity}
                label="高重要度核心认知"
                value={criticalCount}
                unit="项"
                desc="关键安全指令或用户核心约束条款"
                accent="danger"
              />
              <StatCard
                icon={Sparkles}
                label="历史累计召回次数"
                value={totalRecallCount}
                unit="次唤醒"
                desc={`平均单条事实被唤起推理 ${(totalRecallCount / Math.max(1, totalCount)).toFixed(1)} 次`}
                accent="warning"
              />
            </div>

            {/* 内容区：左侧筛选 + 右侧表格 */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              {/* 左侧筛选 */}
              <div className="w-full lg:w-56 shrink-0 bg-muted/30 border border-line rounded-3xl p-5 flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-3">
                    认知维度目录
                  </h4>
                  <div className="flex flex-col gap-1">
                    {categoryFilters.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setCategoryFilter(tab.id)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left',
                          categoryFilter === tab.id
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'text-fg hover:bg-muted',
                        )}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-md',
                            categoryFilter === tab.id
                              ? 'bg-primary-foreground/20'
                              : 'bg-muted text-fg-muted',
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <h4 className="text-xs font-bold text-fg-muted uppercase tracking-wider mb-3">
                    重要度优先权
                  </h4>
                  <div className="space-y-1.5">
                    {importanceFilters.map((lvl) => (
                      <label
                        key={lvl.id}
                        className="flex items-center gap-2 cursor-pointer text-xs text-fg font-medium"
                      >
                        <input
                          type="radio"
                          name="importance"
                          checked={importanceFilter === lvl.id}
                          onChange={() => setImportanceFilter(lvl.id)}
                        />
                        <span>{lvl.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-line">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-xs text-primary leading-relaxed font-semibold">
                      💡
                      长期记忆由智能体在对话过程中自动凝练生成或管理员手动配置，用于在超长上下文下智能决策。
                    </p>
                  </div>
                </div>
              </div>

              {/* 右侧表格 */}
              <div className="flex-1 border border-line rounded-3xl shadow-sm flex flex-col overflow-hidden">
                {/* 表头搜索栏 */}
                <div className="px-6 py-4 border-b border-line flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="检索记忆描述、关联智能体、标签事实..."
                      className="pl-9"
                    />
                  </div>

                  <Button onClick={openCreate}>
                    <Plus size={14} />
                    手动录入记忆项
                  </Button>
                </div>

                {/* 表格 */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="h-96 flex items-center justify-center text-fg-muted text-sm">
                      加载中...
                    </div>
                  ) : memories.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center p-12 text-center text-fg-muted">
                      <div className="p-6 bg-muted rounded-3xl mb-4">
                        <Brain size={48} className="opacity-40" />
                      </div>
                      <h4 className="text-sm font-bold text-fg">未检索到任何符合条件的记忆档案</h4>
                      <p className="text-xs text-fg-muted mt-1 max-w-sm">
                        请尝试更新筛选维度、降低搜索关键词复杂性或点击上方按钮手动录入新认知。
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line text-xs font-bold text-fg-muted uppercase tracking-wider bg-muted/30">
                          <th className="py-4 px-6">记忆档案内容</th>
                          <th className="py-4 px-4 w-28">认知维度</th>
                          <th className="py-4 px-4 w-40">关联服务智能体</th>
                          <th className="py-4 px-4 w-24">重要度</th>
                          <th className="py-4 px-4 w-20 text-center">召回次数</th>
                          <th className="py-4 px-4 w-20 text-center">状态</th>
                          <th className="py-4 px-6 w-32 text-right">管理操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {memories.map((mem) => (
                          <tr
                            key={mem.id}
                            className="group hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-4 px-6 text-xs leading-relaxed max-w-md">
                              <div className="font-semibold text-fg">{mem.content}</div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {mem.tags.map((tg, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    #{tg}
                                  </Badge>
                                ))}
                                <span className="text-xs text-fg-muted ml-auto flex items-center gap-1">
                                  <Calendar size={10} /> {formatDate(mem.updateTime)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant={
                                  mem.category === 'preference'
                                    ? 'default'
                                    : mem.category === 'fact'
                                      ? 'secondary'
                                      : mem.category === 'episodic'
                                        ? 'outline'
                                        : 'default'
                                }
                              >
                                {categoryLabel(mem.category)}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-xs font-bold text-fg">
                              <div className="flex items-center gap-1.5 truncate w-36">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {mem.agentName}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase">
                                <span
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    mem.importance === 'critical'
                                      ? 'bg-destructive'
                                      : mem.importance === 'high'
                                        ? 'bg-orange-500'
                                        : mem.importance === 'medium'
                                          ? 'bg-blue-500'
                                          : 'bg-fg-muted',
                                  )}
                                />
                                {mem.importance}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center font-mono text-xs font-bold text-fg-muted">
                              {mem.hitCount}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Switch
                                checked={mem.status === 'active'}
                                onCheckedChange={() => handleToggleStatus(mem.id)}
                              />
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openEdit(mem)}
                                  title="修改记忆"
                                >
                                  <Settings2 size={13} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDelete(mem.id)}
                                  title="废弃删除"
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 表脚 */}
                <div className="bg-muted/30 px-6 py-3 border-t border-line flex items-center justify-between text-xs font-bold text-fg-muted">
                  <span>当前视图召回队列: {memories.length} / {totalCount} 组条目</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>用于存储和维护用户或业务相关的长期记忆信息</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== Tab 2: 认知提取 ====== */}
        {activeTab === 'extraction' && (
          <div className="flex flex-col gap-6">
            <div className="p-6 border border-line rounded-3xl">
              <header className="mb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    自动记忆重塑 (Unsupervised Memory Extraction)
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight">
                  智能体交互会话语义事实总结管道
                </h2>
                <p className="text-xs text-fg-muted mt-1 max-w-3xl leading-relaxed">
                  大模型在与用户的多轮交互过程中，自动识别用户显式表达或隐式表现出的长期偏好与事实信息，并进行结构化提炼，形成用户专属的认知档案。
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* 左侧编辑区 */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fg-muted uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare size={13} /> 会话聊天记录原文 (Simulation Input)
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        setTranscript(
                          '用户：汽轮机组1号高压油泵运行指示不对，可能是由于反馈信号松动引起的，另外注意：一旦高压油泵反馈信号松动报警，在以后的日志提示里我们要强制置顶。 \n智能体：收到，汽轮机1号高压油泵信号松动可能产生虚警。下次出现此故障警报时，我会进行警报日志置顶突出显示，并在您的建议列表中优先呈现该规则。',
                        )
                      }
                    >
                      <RefreshCw size={11} />
                      切换第二套工业场景语料
                    </Button>
                  </div>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="min-h-[160px] resize-none"
                    placeholder="输入模拟的一段单轮或多轮对话，以便测试提取引擎的准确率..."
                  />
                  <Button onClick={runExtraction} disabled={isExtracting}>
                    {isExtracting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        大语言模型正在深度理解语法抽取中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        自动解析并凝练记忆点 (Generate Memory Fact)
                      </>
                    )}
                  </Button>
                </div>

                {/* 右侧结果区 */}
                <div className="flex flex-col border border-line rounded-2xl bg-muted/10 p-5 min-h-[240px] justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
                      <span className="text-xs font-bold text-fg-muted uppercase tracking-wider flex items-center gap-1">
                        <Activity size={13} /> 凝练实体事实提取结果
                      </span>
                      {extractedItems.length > 0 && (
                        <Badge variant="default" className="text-xs bg-emerald-500">
                          成功转化 {extractedItems.length} 个认知
                        </Badge>
                      )}
                    </div>

                    {isExtracting ? (
                      <div className="py-12 flex flex-col items-center justify-center text-fg-muted text-center gap-3">
                        <RefreshCw size={36} className="text-primary animate-spin" />
                        <span className="text-xs font-bold">
                          正在调用语义认知神经网络，提取结构化记录...
                        </span>
                      </div>
                    ) : extractedItems.length === 0 ? (
                      <div className="py-10 flex flex-col items-center justify-center text-fg-muted text-center">
                        <Database size={40} className="opacity-30 mb-2" />
                        <span className="text-xs font-bold">目前暂未开启凝练，点击左侧按钮进行测试</span>
                        <p className="text-xs mt-1 max-w-xs">
                          模拟器将会通过 prompt 归纳模式分析其背景，提取最终的倾向性用户偏好或设备变更事实。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                        {extractedItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-background p-4 rounded-xl border border-line relative group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                属性：{item.typeLabel}
                              </Badge>
                              <span className="text-xs text-emerald-500 font-extrabold">
                                可信度: {item.confidence}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-fg">{item.fact}</p>
                            <p className="text-xs text-fg-muted mt-1 italic">
                              依据推理: {item.reason}
                            </p>
                            <div className="mt-3 pt-3 border-t border-line flex justify-end">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => mergeExtracted(item)}
                              >
                                准予归档，同步到记忆档案
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-line text-xs text-fg-muted leading-relaxed">
                    🔍 提醒：生产环境里，此行为通常是无声运行在每个 Agent 会话结束的冷却阶段。
                  </div>
                </div>
              </div>
            </div>

            {/* 提取规则 */}
            <div className="border border-line rounded-3xl p-6">
              <h3 className="text-sm font-bold text-fg mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full" />
                记忆重组提炼规则定义 (Extraction Pipeline Rules)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: '用户首选交互偏好',
                    trigger:
                      "当用户连续2次明示说明或者强烈表述'我不需要...'或'我更希望...'时",
                    result: '提取为 Preference 类别记忆项，赋予 Medium 的高频初始权值。',
                  },
                  {
                    title: '生产运维变动事实',
                    trigger: '当对话提到阀门、主变、辅机、参数设定被手动临时更改时',
                    result:
                      '提取为 Fact 类别记忆项，并赋予 High 触发重要程度，限制单 Agent 强匹配。',
                  },
                  {
                    title: '历史遗留会话跟进',
                    trigger: '检测到特定会话对未完成开发/排查故障有明显交代时',
                    result:
                      '提取为 Episodic 认知快照，设定失效时间周期30天，过期自动丢弃。',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-muted/30 border border-line rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-fg">{item.title}</h4>
                      <p className="text-xs text-fg-muted mt-2">
                        <span className="font-extrabold text-primary">触发条件:</span>{' '}
                        {item.trigger}
                      </p>
                    </div>
                    <p className="text-xs text-fg-muted mt-2 border-t border-line pt-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="font-extrabold">提炼动作:</span> {item.result}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== Tab 3: 记忆测试 ====== */}
        {activeTab === 'simulation' && (
          <div className="flex flex-col gap-6">
            <div className="p-6 border border-line rounded-3xl flex flex-col overflow-hidden">
              <header className="mb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Activity size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    向量匹配模型测试召回柜 (Recall Simulation Tester)
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight">
                  智能体记忆实时召回匹配模拟器
                </h2>
                <p className="text-xs text-fg-muted mt-1 max-w-3xl leading-relaxed">
                  用于对记忆库内容进行检索与验证，通过调试方式检查记忆召回效果与准确性。
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
                {/* 左侧设置 */}
                <div className="lg:col-span-5 space-y-5 bg-muted/30 p-6 rounded-3xl border border-line">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    运行设置区
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-fg-muted">记忆召回相关度阈值</span>
                        <span className="px-2 py-0.5 bg-background rounded border border-line text-xs font-bold">
                          {recallThreshold}
                        </span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        min={0}
                        max={1}
                        step={0.05}
                        defaultValue={recallThreshold}
                        disabled
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-fg-muted uppercase tracking-wider block">
                        嵌入匹配模型 (Embedding)
                      </label>
                      <Select value={recallModel} onValueChange={setRecallModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bge-large-zh-v1.5 (Cosine)">
                            bge-large-zh-v1.5 (Cosine)
                          </SelectItem>
                          <SelectItem value="text-embedding-3-small">
                            text-embedding-3-small
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-fg-muted uppercase tracking-wider block">
                        最大召回限制数 (Top-K)
                      </label>
                      <Select
                        value={String(recallTopK)}
                        onValueChange={(v) => setRecallTopK(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Top 3 最优记忆</SelectItem>
                          <SelectItem value="5">Top 5 深度扩充</SelectItem>
                          <SelectItem value="1">Top 1 全力限制</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-line">
                    <div className="space-y-1.5 mb-4">
                      <label className="text-xs font-bold text-fg-muted uppercase tracking-wider block">
                        输入模拟的用户消息 (User Query)
                      </label>
                      <Textarea
                        value={recallQuery}
                        onChange={(e) => setRecallQuery(e.target.value)}
                        className="h-24 resize-none"
                        placeholder="在此输入测试查询问题..."
                      />
                    </div>
                    <Button onClick={runSimulation} disabled={isSimulating} className="w-full">
                      {isSimulating ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          向量相似度精算匹配中...
                        </>
                      ) : (
                        <>
                          <Activity size={14} />
                          一键仿真检索记忆 (Recall Tester)
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 右侧结果 */}
                <div className="lg:col-span-7 flex flex-col border border-line rounded-3xl overflow-hidden min-h-[380px] justify-between">
                  <div>
                    <div className="p-4 border-b border-line flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                        匹配命中反馈 ({recalledList.length} 个项目)
                      </h3>
                      {recalledList.length > 0 && (
                        <Button variant="link" size="sm" onClick={() => setRecalledList([])}>
                          清除匹配
                        </Button>
                      )}
                    </div>

                    {isSimulating ? (
                      <div className="py-24 flex flex-col items-center justify-center text-fg-muted text-center gap-3">
                        <RefreshCw size={36} className="text-primary animate-spin" />
                        <span className="text-xs font-bold">
                          基于高维特征空间进行局部搜索中...
                        </span>
                      </div>
                    ) : recalledList.length === 0 ? (
                      <div className="py-24 flex flex-col items-center justify-center text-fg-muted p-6 text-center">
                        <div className="p-5 bg-muted rounded-3xl mb-4">
                          <Search size={36} className="opacity-30" />
                        </div>
                        <p className="text-xs font-bold text-fg">目前尚未执行匹配测试</p>
                        <p className="text-xs mt-1 max-w-sm">
                          在左侧配置好 Query 之后运行。不同的关键字将大幅度改变余弦相似度分数。
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3.5 max-h-[340px] overflow-y-auto">
                        {recalledList.map((mem, idx) => {
                          const isHighMatch = mem.score >= recallThreshold;
                          return (
                            <div
                              key={mem.id}
                              className={cn(
                                'p-4 rounded-2xl border transition-all',
                                isHighMatch
                                  ? 'bg-emerald-500/5 border-emerald-500/10'
                                  : 'bg-background border-line opacity-60',
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    RANK {idx + 1}
                                  </Badge>
                                  <span className="text-xs font-bold text-fg-muted">
                                    {mem.agentName}
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-fg">
                                  相似度:{' '}
                                  <span
                                    className={
                                      isHighMatch
                                        ? 'text-emerald-600 text-sm font-extrabold'
                                        : 'text-fg-muted'
                                    }
                                  >
                                    {mem.score}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs font-semibold text-fg">{mem.content}</p>
                              <div className="flex gap-2.5 mt-2.5 pt-2.5 border-t border-line items-center justify-between">
                                <Badge
                                  variant={isHighMatch ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {isHighMatch
                                    ? '召回状态: 成功加载至上下文'
                                    : '召回状态: 低于阈值已过滤'}
                                </Badge>
                                <span className="text-xs text-fg-muted">
                                  重要度: {mem.importance}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-muted/30 border-t border-line text-xs text-fg-muted">
                    💡 相似度排名前面的激活态记忆档案，在运行时会被直接并入内置 System Settings
                    进行指令增强。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== 新增/编辑弹窗 ====== */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editMemory ? '编辑长效记忆条目' : '录入新长效记忆要素'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                  记忆事实描述内容 (Fact Body)
                </label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="h-28 resize-none"
                  placeholder="例如: 1号超超临界锅炉的汽侧安全阀整定压力设定为 26.5 MPa，请严格维护反馈规范值。"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                    认知存储类别
                  </label>
                  <Select
                    value={formCategory}
                    onValueChange={(v) => setFormCategory(v as MemoryCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preference">用户习惯 (Preference)</SelectItem>
                      <SelectItem value="fact">系统事实 (Operational Fact)</SelectItem>
                      <SelectItem value="episodic">会话摘要 (Episodic)</SelectItem>
                      <SelectItem value="behavior">行为特征 (Behavioral)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                    召回严重级别 (Priority)
                  </label>
                  <Select
                    value={formImportance}
                    onValueChange={(v) => setFormImportance(v as ImportanceLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">非常核心 (Critical)</SelectItem>
                      <SelectItem value="high">中高匹配 (High)</SelectItem>
                      <SelectItem value="medium">普通检索 (Medium)</SelectItem>
                      <SelectItem value="low">次要参考 (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                  挂载服务智能体 (Linked Agent)
                </label>
                <Select value={formAgentName} onValueChange={setFormAgentName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_OPTIONS.map((agent) => (
                      <SelectItem key={agent} value={agent}>
                        {agent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                  检索关键词标签 (以逗号隔开)
                </label>
                <Input
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="例如: 锅炉, 警报器, 临检设定"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-line">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                确定并存储记录
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ====== StatCard 辅助组件 ======

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  desc,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  desc: string;
  accent: 'primary' | 'success' | 'danger' | 'warning';
}) {
  const iconColor = {
    primary: 'text-primary',
    success: 'text-emerald-600',
    danger: 'text-destructive',
    warning: 'text-amber-600',
  }[accent];

  const valueColor = {
    primary: 'text-fg',
    success: 'text-emerald-600',
    danger: 'text-destructive',
    warning: 'text-amber-600',
  }[accent];

  return (
    <div className="border border-line rounded-3xl p-5 bg-background shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label}</span>
        <div className={cn('p-2 rounded-xl bg-muted/30', iconColor)}>
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={cn('text-2xl font-bold', valueColor)}>
          {value}{' '}
          <span className="text-xs font-medium text-fg-muted">{unit}</span>
        </h3>
      </div>
      <p className="text-xs text-fg-muted mt-2">{desc}</p>
    </div>
  );
}
