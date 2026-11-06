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
import { Camera, X, SendHorizontal, Sparkles, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceInput } from '@/features/speech/useVoiceInput';
import { VoiceMicButton } from '@/features/speech/VoiceMicButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ─── ChatInputBar ─── */
interface ChatInputBarProps {
  compact?: boolean;
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
  compact = false, cameraCaptureEnabled, onCapture, pendingFileName, onRemoveFile, hasAttachment,
  value, onChange, onSend, onStop, disabled, isSending,
  placeholder, onOpenAgentPicker, activeAgentLabel,
}: ChatInputBarProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const sendRef = useRef({ onSend, disabled, isSending });
  sendRef.current = { onSend, disabled, isSending };
  const voice = useVoiceInput({ value, onChange, disabled: disabled || isSending, onError: message => toast.error(message) });
  const send = async () => {
    if (voice.status === 'stopping') return;
    if (voice.listening) await voice.stop();
    // 使用最新回调发送，包含停止识别时收到的最终纠错文本。
    const latest = sendRef.current;
    if (!latest.disabled && !latest.isSending) latest.onSend();
  };
  return (
    <div className="relative">
      {pendingFileName && <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Camera size={14} /><span className="truncate">{pendingFileName}</span><Button variant="ghost" size="icon-xs" disabled={disabled} onClick={onRemoveFile} aria-label="移除照片"><X size={12} /></Button></div>}
      {cameraCaptureEnabled && <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onCapture?.(file); event.target.value = ''; }} />}
      {/* 品牌色描边容器 */}
      <div className={cn('border shadow-sm', compact ? 'rounded-2xl border-border bg-card focus-within:border-ring' : 'rounded-full border-primary/70 bg-background')}>
        {compact && <div className="px-3 pt-3"><Button variant="ghost" size="sm" onClick={onOpenAgentPicker} className="h-auto max-w-full justify-start gap-2 rounded-lg bg-primary/5 px-2 py-1.5 text-xs text-primary-text" title={activeAgentLabel || '选择智能体'}><Sparkles size={14} /><span className="truncate">{activeAgentLabel || '选择智能体开始对话'}</span></Button></div>}
        <div className={cn("flex h-14 w-full items-center", compact ? "gap-2 rounded-2xl px-3" : "gap-3 rounded-full bg-background px-4")}>
          {/* 智能体选择按钮 */}
          {!compact && <Button
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
          </Button>}

          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
            disabled={disabled}
            readOnly={voice.listening}
            placeholder={voice.listening ? '正在识别…' : compact && activeAgentLabel ? '输入你的问题…' : placeholder}
            className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0 disabled:opacity-60 dark:bg-transparent"
          />

          <div className="flex items-center gap-2 pr-1">
            {cameraCaptureEnabled && <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={() => cameraRef.current?.click()} aria-label="拍照"><Camera size={18} /></Button>}
            <VoiceMicButton voice={voice} disabled={disabled || isSending} />
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
                aria-label="发送消息"
                onClick={() => void send()}
                disabled={disabled || voice.status === 'stopping' || (!value.trim() && !hasAttachment)}
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
