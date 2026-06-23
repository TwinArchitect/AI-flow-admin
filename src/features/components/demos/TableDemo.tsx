import type { ColumnDef, Table as TanTable } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Trash2, Download } from 'lucide-react';

// ── 数据类型 ─────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
  amount: number;
}

const ALL_DATA: User[] = [
  { id: 1,  name: '张三',   email: 'zhangsan@example.com', role: '管理员', status: '活跃', joined: '2024-01-10', amount: 12800 },
  { id: 2,  name: '李四',   email: 'lisi@example.com',     role: '编辑',   status: '活跃', joined: '2024-02-15', amount: 6400  },
  { id: 3,  name: '王五',   email: 'wangwu@example.com',   role: '查看者', status: '禁用', joined: '2024-03-22', amount: 3200  },
  { id: 4,  name: '赵六',   email: 'zhaoliu@example.com',  role: '编辑',   status: '活跃', joined: '2024-04-08', amount: 9600  },
  { id: 5,  name: '钱七',   email: 'qianqi@example.com',   role: '管理员', status: '待审', joined: '2024-05-01', amount: 15000 },
  { id: 6,  name: '孙八',   email: 'sunba@example.com',    role: '查看者', status: '活跃', joined: '2024-05-18', amount: 2100  },
  { id: 7,  name: '周九',   email: 'zhoujiu@example.com',  role: '编辑',   status: '禁用', joined: '2024-06-03', amount: 4800  },
  { id: 8,  name: '吴十',   email: 'wushi@example.com',    role: '查看者', status: '活跃', joined: '2024-06-20', amount: 1600  },
  { id: 9,  name: '郑十一', email: 'zheng@example.com',    role: '编辑',   status: '待审', joined: '2024-07-05', amount: 7200  },
  { id: 10, name: '冯十二', email: 'feng@example.com',     role: '管理员', status: '活跃', joined: '2024-07-22', amount: 18500 },
  { id: 11, name: '陈十三', email: 'chen@example.com',     role: '查看者', status: '禁用', joined: '2024-08-10', amount: 2800  },
  { id: 12, name: '褚十四', email: 'chu@example.com',      role: '编辑',   status: '活跃', joined: '2024-08-28', amount: 5500  },
];

const STATUS_STYLE: Record<string, string> = {
  活跃: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  禁用: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  待审: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
};

// ── 列定义（ColumnDef[] 声明式，与渲染逻辑分离）─────────────────────
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
    enableSorting: false,
    cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue('id')}</span>,
  },
  {
    accessorKey: 'name',
    header: '姓名',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('name')}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: '邮箱',
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue('email')}</span>,
  },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.getValue('role')}</Badge>,
    filterFn: (row, _id, value) => value === '全部' || row.getValue('role') === value,
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const s = row.getValue<string>('status');
      return <Badge className={`text-xs ${STATUS_STYLE[s]}`}>{s}</Badge>;
    },
    filterFn: (row, _id, value) => value === '全部' || row.getValue('status') === value,
  },
  {
    accessorKey: 'amount',
    header: '金额',
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">¥{(row.getValue<number>('amount')).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'joined',
    header: '加入时间',
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue('joined')}</span>,
  },
  {
    id: 'actions',
    header: '',
    size: 48,
    enableSorting: false,
    enableHiding: false,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>查看详情</DropdownMenuItem>
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>重置密码</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">禁用账号</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// ── 工具栏：状态筛选 + 角色筛选 + 批量操作 ─────────────────────────
function UserTableToolbar({ table }: { table: TanTable<User> }) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  return (
    <>
      <Select
        value={(table.getColumn('status')?.getFilterValue() as string) ?? '全部'}
        onValueChange={v => table.getColumn('status')?.setFilterValue(v === '全部' ? undefined : v)}
      >
        <SelectTrigger className="w-[100px] h-8 text-sm">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          {['全部', '活跃', '禁用', '待审'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={(table.getColumn('role')?.getFilterValue() as string) ?? '全部'}
        onValueChange={v => table.getColumn('role')?.setFilterValue(v === '全部' ? undefined : v)}
      >
        <SelectTrigger className="w-[100px] h-8 text-sm">
          <SelectValue placeholder="角色" />
        </SelectTrigger>
        <SelectContent>
          {['全部', '管理员', '编辑', '查看者'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-muted-foreground">已选 {selectedCount} 条</span>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Download size={12} />导出
          </Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1"
            onClick={() => table.resetRowSelection()}>
            <Trash2 size={12} />删除
          </Button>
        </div>
      )}
    </>
  );
}

export function TableDemo() {
  return (
    <div className="space-y-8">

      {/* ── 示例一：完整功能（TanStack Table + DataTable 封装）── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          完整功能表格（TanStack Table）
        </h3>
        <DataTable<User, unknown>
          columns={userColumns}
          data={ALL_DATA}
          searchPlaceholder="搜索姓名..."
          searchColumn="name"
          selectable
          showViewOptions
          pageSize={5}
          toolbar={table => <UserTableToolbar table={table} />}
        />
      </section>

      {/* ── 示例二：列拖拽排序 + 列宽拖动 ─────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          列拖拽排序 + 列宽拖动
        </h3>
        <p className="text-xs text-muted-foreground">
          拖动表头可调整列顺序；拖动表头右侧边缘可调整列宽。
        </p>
        <DataTable<User, unknown>
          columns={userColumns}
          data={ALL_DATA.slice(0, 8)}
          searchColumn="name"
          searchPlaceholder="搜索姓名..."
          showPagination={false}
          selectable
          enableColumnReordering
          enableColumnResizing
        />
      </section>

      {/* ── 示例三：极简只读（无选择、无工具栏、无分页）── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          简单只读表格
        </h3>
        <DataTable<User, unknown>
          columns={[
            { accessorKey: 'name', header: '姓名' },
            { accessorKey: 'role', header: '角色' },
            {
              accessorKey: 'status',
              header: '状态',
              cell: ({ row }) => {
                const s = row.getValue<string>('status');
                return <Badge className={`text-xs ${STATUS_STYLE[s]}`}>{s}</Badge>;
              },
            },
            { accessorKey: 'joined', header: '加入时间' },
          ]}
          data={ALL_DATA.slice(0, 5)}
          showViewOptions={false}
          showPagination={false}
        />
      </section>

      {/* ── 示例四：统计汇总表（原生 Table，非 DataTable）── */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          统计汇总表（原生 Table 组件）
        </h3>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>角色</TableHead>
                <TableHead className="text-right">总人数</TableHead>
                <TableHead className="text-right">活跃</TableHead>
                <TableHead className="text-right">禁用</TableHead>
                <TableHead className="text-right">总金额</TableHead>
                <TableHead className="text-right">均值</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['管理员', '编辑', '查看者'].map(role => {
                const rows = ALL_DATA.filter(r => r.role === role);
                const active = rows.filter(r => r.status === '活跃').length;
                const total = rows.reduce((s, r) => s + r.amount, 0);
                return (
                  <TableRow key={role}>
                    <TableCell className="font-medium">{role}</TableCell>
                    <TableCell className="text-right tabular-nums">{rows.length}</TableCell>
                    <TableCell className="text-right text-green-600 tabular-nums">{active}</TableCell>
                    <TableCell className="text-right text-red-500 tabular-nums">{rows.length - active}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">¥{total.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      ¥{Math.round(total / rows.length).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell>合计</TableCell>
                <TableCell className="text-right tabular-nums">{ALL_DATA.length}</TableCell>
                <TableCell className="text-right text-green-600 tabular-nums">{ALL_DATA.filter(r => r.status === '活跃').length}</TableCell>
                <TableCell className="text-right text-red-500 tabular-nums">{ALL_DATA.filter(r => r.status === '禁用').length}</TableCell>
                <TableCell className="text-right tabular-nums">¥{ALL_DATA.reduce((s, r) => s + r.amount, 0).toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  ¥{Math.round(ALL_DATA.reduce((s, r) => s + r.amount, 0) / ALL_DATA.length).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
