import { Terminal } from 'lucide-react';
import { ToolsPage } from './ToolsPage';

export function McpToolsPage() {
  return (
    <ToolsPage
      type="MCP"
      icon={Terminal}
      gradient="bg-gradient-to-br from-muted/50 to-purple-50/40 dark:from-slate-900 dark:to-purple-950/20"
      badgeClass="bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40"
      title="MCP 工具管理"
      description="平台连接业务的能力枢纽，统一集成企业业务系统和第三方工具，让智能体具备实际业务执行能力。"
    />
  );
}
