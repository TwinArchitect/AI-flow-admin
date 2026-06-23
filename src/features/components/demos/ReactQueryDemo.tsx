import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

// ── Mock 数据 ────────────────────────────────────────────────────
interface MockUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'disabled';
}

const MOCK_USERS: MockUser[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: 'editor', status: 'active' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: 'viewer', status: 'disabled' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: 'editor', status: 'active' },
  { id: 5, name: '孙七', email: 'sunqi@example.com', role: 'viewer', status: 'active' },
];

// 模拟接口：延迟 800ms 返回数据
function mockFetchUsers(): Promise<MockUser[]> {
  return new Promise(resolve => setTimeout(() => resolve([...MOCK_USERS]), 800));
}

// 模拟接口：延迟 600ms，随机 30% 概率失败
function mockFetchWithError(): Promise<MockUser[]> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error('服务器繁忙，请稍后重试'));
      } else {
        resolve([...MOCK_USERS]);
      }
    }, 600)
  );
}

// 模拟创建用户接口
let nextId = 6;
function mockCreateUser(name: string): Promise<MockUser> {
  return new Promise(resolve =>
    setTimeout(() => {
      const user: MockUser = {
        id: nextId++,
        name,
        email: `${name.toLowerCase()}@example.com`,
        role: 'viewer',
        status: 'active',
      };
      MOCK_USERS.push(user);
      resolve(user);
    }, 500)
  );
}

// ── 列定义 ───────────────────────────────────────────────────────
const columns: ColumnDef<MockUser>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'email', header: '邮箱' },
  { accessorKey: 'role', header: '角色' },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
        {row.original.status === 'active' ? '活跃' : '禁用'}
      </Badge>
    ),
  },
];

// ── 示例1：基础查询（loading / error / data） ───────────────────
function BasicQueryDemo() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['demo-users'],
    queryFn: mockFetchUsers,
    staleTime: 1000 * 30, // 30秒内不重新请求
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-[var(--color-text-primary)]">基础查询</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            useQuery — 自动缓存、loading 状态、error 处理
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? '刷新中...' : '手动刷新'}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      )}

      {isError && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
          请求失败：{(error as Error).message}
        </div>
      )}

      {data && (
        <DataTable columns={columns} data={data} showPagination={false} showViewOptions={false} />
      )}
    </div>
  );
}

// ── 示例2：错误处理与重试 ────────────────────────────────────────
function ErrorHandlingDemo() {
  const { data, isLoading, isError, error, refetch, failureCount } = useQuery({
    queryKey: ['demo-users-error'],
    queryFn: mockFetchWithError,
    retry: 2, // 失败后自动重试 2 次
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-[var(--color-text-primary)]">错误处理 & 重试</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            30% 概率失败，自动重试 2 次，可手动重试
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          重新请求
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          请求中{failureCount > 0 ? `（第 ${failureCount} 次重试）` : ''}...
        </div>
      )}

      {isError && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
          ❌ {(error as Error).message}
          <span className="ml-2 text-xs opacity-70">（已重试 {failureCount} 次）</span>
        </div>
      )}

      {data && (
        <div className="text-sm text-emerald-600">✅ 请求成功，返回 {data.length} 条数据</div>
      )}
    </div>
  );
}

// ── 示例3：Mutation（写操作） ────────────────────────────────────
function MutationDemo() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (userName: string) => mockCreateUser(userName),
    onSuccess: () => {
      // 创建成功后使列表缓存失效，触发自动重新请求
      queryClient.invalidateQueries({ queryKey: ['demo-users'] });
      setName('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    reset();
    mutate(name.trim());
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-[var(--color-text-primary)]">Mutation（写操作）</h3>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
          useMutation — 创建成功后自动刷新上方列表缓存
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="输入新用户姓名"
          className="flex-1 h-9 rounded-md border border-[var(--color-border-default)] bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending ? '创建中...' : '创建用户'}
        </Button>
      </form>

      {isSuccess && (
        <p className="text-sm text-emerald-600">✅ 创建成功！查看上方列表已更新</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">❌ {(error as Error).message}</p>
      )}
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────────
export function ReactQueryDemo() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">React Query 示例</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          演示 useQuery / useMutation 的核心用法，queryFn 为 mock 函数，接真实接口时替换即可
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--color-border-default)] p-5">
          <BasicQueryDemo />
        </div>
        <div className="rounded-lg border border-[var(--color-border-default)] p-5">
          <ErrorHandlingDemo />
        </div>
        <div className="rounded-lg border border-[var(--color-border-default)] p-5">
          <MutationDemo />
        </div>
      </div>
    </div>
  );
}
