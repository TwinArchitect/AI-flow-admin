import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Workflow,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  Bot,
  GitBranch,
  Puzzle,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('zhang.hao@acme.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setToken('mock-token-xxx', 'mock-refresh-token-xxx');
      setUser({
        id: 1,
        username: 'admin',
        nickname: '管理员',
        email: email,
        role: 'admin',
        permissions: ['*'],
      });
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ---------- 左侧：品牌展示区 ---------- */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-[var(--color-slate-900)] via-[#2d2d7a] to-violet-800 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        </div>

        {/* 顶部 Logo */}
        <div className="relative z-10 p-8 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">智构平台</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-white/70">v2.4</span>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="relative z-10 px-8 max-w-md">
          <h1 className="text-3xl font-bold leading-tight mb-3">
            大规模构建<br />智能体应用
          </h1>
          <p className="text-sm text-white/60 leading-relaxed mb-8">
            编排大语言模型、连接知识库、自动化工作流——一站式 AI 智能体开发平台。
          </p>

          {/* 功能卡片 */}
          <div className="space-y-3">
            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                <Workflow size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">多模型编排</h3>
                <p className="text-xs text-white/50 mt-0.5">Claude, GPT-4o, Gemini 等主流模型</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shrink-0">
                <GitBranch size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">可视化工作流构建器</h3>
                <p className="text-xs text-white/50 mt-0.5">拖拽式节点编排，所见即所得</p>
              </div>
            </div>

            <div className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                <Puzzle size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">插件生态市场</h3>
                <p className="text-xs text-white/50 mt-0.5">200+ 预置集成，开箱即用</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部统计数据 */}
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-12">
            <div>
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-xs text-white/50">已部署智能体</div>
            </div>
            <div>
              <div className="text-2xl font-bold">24亿</div>
              <div className="text-xs text-white/50">月均 API 调用</div>
            </div>
            <div>
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-white/50">可用性 SLA</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 右侧：登录表单 ---------- */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[var(--color-bg-page)] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* 标题 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">欢迎回来</h2>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">登录您的工作空间</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">邮箱</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] z-10 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">密码</label>
                <a href="#" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
                  忘记密码？
                </a>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] z-10 pointer-events-none" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <ArrowRight size={16} />
                  立即登录
                </>
              )}
            </Button>
          </form>

          {/* 终端风格状态卡片 */}
          <div className="mt-6 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-default)] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-mono text-[var(--color-text-tertiary)]">agent.run()</span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-start gap-1.5 text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-tertiary)]">&gt;</span>
                <span>正在初始化智能体运行时...</span>
              </div>
              <div className="flex items-start gap-1.5 text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-tertiary)]">&gt;</span>
                <span className="flex items-center gap-1">
                  加载知识库
                  <CheckCircle2 size={11} className="text-green-500" />
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-tertiary)]">&gt;</span>
                <span className="flex items-center gap-1">
                  连接模型网关
                  <CheckCircle2 size={11} className="text-green-500" />
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-tertiary)]">&gt;</span>
                <span>
                  就绪 — <span className="text-violet-600 font-medium">24</span> 个智能体运行中
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
