import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import {
  Workflow,
  Mail,
  Lock,
  Loader2,
  Bot,
  GitBranch,
  Puzzle,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [username, setUsername] = useState('demo_admin');
  const [password, setPassword] = useState('rma@new123');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      await loginMutation.mutateAsync({ username, password });
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败');
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <motion.div
        className="pointer-events-none absolute left-[35%] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-primary/10 blur-3xl"
        animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
      />

      <section className="relative hidden w-[56%] flex-col justify-between border-r border-border bg-card/65 px-14 py-12 backdrop-blur-xl lg:flex xl:px-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:36px_36px]" />
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
          animate={{ y: ['8vh', '88vh'], opacity: [0, 0.7, 0] }}
          transition={{ duration: 9, ease: 'linear', repeat: Infinity, repeatDelay: 2 }}
        />
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Bot size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">智构平台</div>
            <div className="text-xs text-muted-foreground">企业级智能体开发与运营平台</div>
          </div>
        </motion.div>

        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            AI Agent Platform
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.18] tracking-tight xl:text-5xl">
            让智能体真正进入
            <span className="mt-2 block text-primary">企业业务流程</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            统一连接模型、知识与业务系统，在安全可控的环境中完成智能体构建、编排、发布和运营。
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-7">
            {[
              { icon: Workflow, title: '模型编排', desc: '统一接入与调度' },
              { icon: GitBranch, title: '工作流', desc: '可视化业务编排' },
              { icon: Puzzle, title: '开放集成', desc: '连接企业系统' },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18 }}
              >
                <Icon size={18} className="mb-3 text-primary" />
                <div className="text-sm font-medium">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-6 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.25 }}
        >
          <span>安全可控</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>统一治理</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>持续运营</span>
        </motion.div>
      </section>

      <section className="relative flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card/80 p-7 shadow-lg backdrop-blur-xl sm:p-9"
          initial={{ opacity: 0, x: 20, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
        >
          <motion.div
            className="pointer-events-none absolute left-0 top-0 h-px w-28 bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            animate={{ x: ['-140%', '460%'], opacity: [0, 1, 0] }}
            transition={{ duration: 3.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}
          />
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot size={18} />
            </div>
            <span className="font-semibold">智构平台</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">登录工作空间</h2>
            <p className="mt-2 text-sm text-muted-foreground">使用您的企业账号继续访问平台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 pl-10"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">密码</label>
                <a href="#" className="text-xs text-primary transition-colors hover:text-primary/80">
                  忘记密码？
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="h-11 w-full gap-2"
            >
              {loginMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  登录
                  <motion.span
                    className="inline-flex"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5 }}
                  >
                    <ArrowRight size={16} />
                  </motion.span>
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            登录即表示您同意平台的使用规范与数据安全政策
          </p>
        </motion.div>
      </section>
      </div>
    </MotionConfig>
  );
}
