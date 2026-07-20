/**
 * ChatInputBar 聊天输入组件 + PinnedTestAgentShortcuts
 *
 * 迁移映射（原型 → 目标）：
 *   bg-brand-* → bg-primary / text-primary
 *   bg-white dark:bg-slate-900 → bg-background
 *   text-slate-400 → text-muted-foreground / text-fg-subtle
 *   text-slate-700 dark:text-slate-200 → text-foreground
 *   border-slate-100 dark:border-slate-800 → border-border
 *   hover:bg-slate-100 dark:hover:bg-slate-800 → hover:bg-accent
 *   rounded-full → rounded-xl（shadcn 规范）
 *   <button> → <Button>（partial）
 *   motion/react → framer-motion
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, SendHorizontal, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TEST_AGENT_PRESETS, type TestAgentPreset } from '../data/testAgents';

/* ─── PinnedTestAgentShortcuts ─── */
function PinnedTestAgentShortcuts({ onSelect, show }: {
  show: boolean;
  onSelect: (preset: TestAgentPreset) => void;
}) {
  if (!show) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-3">
      <AnimatePresence>
        {TEST_AGENT_PRESETS.map((preset) => (
          <motion.button
            key={preset.customType}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            type="button"
            onClick={() => onSelect(preset)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer',
              preset.color,
            )}
          >
            <Sparkles size={11} className="shrink-0" />
            <span>{preset.name}</span>
            <span className="text-2xs opacity-70 border-l pl-1.5 ml-0.5 border-current font-medium">
              {preset.desc}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── ChatInputBar ─── */
interface ChatInputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder: string;
  onOpenAgentPicker: () => void;
  activeAgentLabel?: string | null;
}

function ChatInputBar({
  value, onChange, onSend, onStop, disabled, isSending,
  placeholder, onOpenAgentPicker, activeAgentLabel,
}: ChatInputBarProps) {
  return (
    <div className="relative">
      {/* 渐变描边容器 */}
      <div className="p-[1.5px] rounded-full bg-linear-to-r from-primary via-purple-500 to-rose-500 shadow-md">
        <div className="w-full bg-background rounded-full h-14 flex items-center px-4 gap-3">
          {/* 智能体选择按钮 */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenAgentPicker}
            className={cn(
              'shrink-0 rounded-xl',
              activeAgentLabel
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'bg-primary/10 hover:bg-primary/20 text-primary',
            )}
            title={activeAgentLabel ? `当前：${activeAgentLabel}` : '选择智能体'}
          >
            <Sparkles size={18} />
          </Button>

          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) onSend(); }}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0 disabled:opacity-60"
          />

          <div className="flex items-center gap-2 pr-1">
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
              <Mic size={18} />
            </Button>
            <div className="w-px h-6 bg-border" />
            {isSending ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onStop}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                title="终止生成"
              >
                <Square size={14} fill="currentColor" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSend}
                disabled={disabled || !value.trim()}
                className={cn(
                  'rounded-lg',
                  value.trim() && !disabled
                    ? 'text-primary hover:text-primary/80'
                    : 'text-muted-foreground/40',
                )}
              >
                <SendHorizontal size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ChatInputArea（组合组件） ─── */
interface ChatInputAreaProps extends ChatInputBarProps {
  showPinnedTestAgents: boolean;
  onSelectTestAgent: (preset: TestAgentPreset) => void;
}

export function ChatInputArea({
  showPinnedTestAgents, onSelectTestAgent, ...inputProps
}: ChatInputAreaProps) {
  return (
    <div>
      <PinnedTestAgentShortcuts
        show={showPinnedTestAgents}
        onSelect={onSelectTestAgent}
      />
      <ChatInputBar {...inputProps} />
    </div>
  );
}
