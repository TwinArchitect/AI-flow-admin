import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      // TODO: 接入真实 API 后替换为 useLogin() mutation
      // 临时 mock：admin/admin 通过
      await new Promise(r => setTimeout(r, 600));
      if (username === 'admin' && password === 'admin') {
        setToken('mock-token-xxx', 'mock-refresh-token-xxx');
        setUser({
          id: 1,
          username: 'admin',
          nickname: '管理员',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['*'],
        });
        navigate('/', { replace: true });
      } else {
        setError('用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)]">
      <div className="w-full max-w-sm space-y-8 px-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <Workflow size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              AI Flow
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              登录以继续使用
            </p>
          </div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              placeholder="请输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </Button>
        </form>

        <p className="text-center text-xs text-[var(--color-text-tertiary)]">
          测试账号：admin / admin
        </p>
      </div>
    </div>
  );
}
