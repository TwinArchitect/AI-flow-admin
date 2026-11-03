import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';

export function PaginationDemo() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const total = 23;
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Pagination 分页</h1>
        <p className="text-sm text-muted-foreground">表格与卡片列表共用，支持切换每页条数、首页和末页。</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, index) => {
            const id = (page - 1) * pageSize + index + 1;
            return <div key={id} className="rounded-xl border bg-card p-4">示例条目 {id}</div>;
          })}
        </div>
        <Pagination className="border-t py-3" page={page} pageSize={pageSize} pageCount={Math.ceil(total / pageSize)} total={total} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">空数据</h2>
        <Pagination page={1} pageSize={10} pageCount={0} total={0} onPageChange={() => {}} />
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">加载中禁用</h2>
        <Pagination page={2} pageSize={10} pageCount={5} total={50} onPageChange={() => {}} onPageSizeChange={() => {}} disabled />
      </section>
    </div>
  );
}
