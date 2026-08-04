import { Settings2, Trash2, Activity, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Tool } from '../data/toolsMock';

interface ToolCardProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDebug: () => void;
}

export function ToolCard({ tool, onEdit, onDelete, onToggle, onDebug }: ToolCardProps) {
  const isActive = tool.status === 'active';

  return (
    <Card className="group rounded-[28px] p-0 border-border/40 hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
      <CardContent className="p-6">
        {/* 状态指示 */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
            )}
          />
          <span className="text-2xs text-muted-foreground font-bold">
            {isActive ? '运行启用' : '暂停停用'}
          </span>
        </div>

        {/* 图标 + 操作按钮 */}
        <div className="flex justify-between items-start mt-3 mb-5">
          <div className="w-13 h-13 bg-muted rounded-2xl flex items-center justify-center overflow-hidden border border-border shadow-inner transition-transform group-hover:scale-105 group-hover:-rotate-2 duration-300">
            <img src={tool.icon} alt={tool.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEdit}
              className="text-muted-foreground hover:text-primary"
            >
              <Settings2 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </Button>
            <Switch checked={isActive} onCheckedChange={onToggle} className="mt-0.5" />
          </div>
        </div>

        {/* 标题 */}
        <div className="flex-1 mb-5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <h4 className="text-xs font-bold text-foreground truncate max-w-[150px] group-hover:text-primary transition-colors">
              {tool.title}
            </h4>
            <Badge
              variant={tool.type === 'HTTP' ? 'default' : 'secondary'}
              className={cn(
                'text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5',
                tool.type === 'HTTP'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
              )}
            >
              {tool.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-medium">
            {tool.description}
          </p>

          {/* 配置元信息 */}
          <div className="mt-3.5 bg-muted/60 p-2.5 rounded-xl border border-border space-y-1 text-2xs font-mono">
            {tool.type === 'HTTP' ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    [{tool.method}]
                  </span>
                  <span className="text-[8px] text-muted-foreground">HTTP REST</span>
                </div>
                <div className="truncate text-muted-foreground">{tool.baseUrl}</div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-600 dark:text-purple-400">CMD</span>
                  <span className="text-[8px] text-muted-foreground">MCP Client</span>
                </div>
                <div className="truncate text-muted-foreground">{tool.command}</div>
              </>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="pt-3.5 border-t border-border">
          <div className="flex items-center justify-between mb-3 text-2xs">
            <Badge variant="outline" className="text-2xs font-bold bg-muted/50">
              {tool.category}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground font-bold">
              <Activity size={10} className="text-success" />
              <span>{tool.usage}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onDebug}
            className="w-full text-xs font-bold rounded-xl gap-1 hover:border-primary/30 hover:text-primary"
          >
            单体调试 <ChevronRight size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
