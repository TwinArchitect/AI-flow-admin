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

import { useRef } from 'react';
import { Camera, X, Mic, SendHorizontal, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ─── ChatInputBar ─── */
interface ChatInputBarProps {
  cameraCaptureEnabled?: boolean;
  onCapture?: (file: File) => void;
  pendingFileName?: string;
  onRemoveFile?: () => void;
  hasAttachment?: boolean;
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
  cameraCaptureEnabled, onCapture, pendingFileName, onRemoveFile, hasAttachment,
  value, onChange, onSend, onStop, disabled, isSending,
  placeholder, onOpenAgentPicker, activeAgentLabel,
}: ChatInputBarProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      {pendingFileName && <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Camera size={14} /><span className="truncate">{pendingFileName}</span><Button variant="ghost" size="icon-xs" disabled={disabled} onClick={onRemoveFile} aria-label="移除照片"><X size={12} /></Button></div>}
      {cameraCaptureEnabled && <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onCapture?.(file); event.target.value = ''; }} />}
      {/* 品牌色描边容器 */}
      <div className="rounded-full border border-primary/70 bg-background shadow-sm">
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
            className="flex-1 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0 disabled:opacity-60 dark:bg-transparent"
          />

          <div className="flex items-center gap-2 pr-1">
            {cameraCaptureEnabled && <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={() => cameraRef.current?.click()} aria-label="拍照"><Camera size={18} /></Button>}
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
                disabled={disabled || (!value.trim() && !hasAttachment)}
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
export function ChatInputArea(inputProps: ChatInputBarProps) {
  return <ChatInputBar {...inputProps} />;
}
