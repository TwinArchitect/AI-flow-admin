import { Link2 } from 'lucide-react';
import { ToolsPage } from './ToolsPage';

export function HttpToolsPage() {
  return (
    <ToolsPage
      type="HTTP"
      icon={Link2}
      gradient="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20"
      badgeClass="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40"
      title="HTTP 工具管理"
      description="平台连接业务的能力枢纽，统一集成企业业务系统和第三方工具，让智能体具备实际业务执行能力。"
    />
  );
}
