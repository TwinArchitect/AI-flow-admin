import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Menu, Minimize2, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { AgentOverviewPage } from '../AgentOverviewPage';
import { Button } from '@/components/ui/button';

const POSITION_KEY = 'floating_ai_assistant_pos';
const EXPANDED_KEY = 'floating_ai_assistant_expanded';
const FAB_SIZE = 48;
const MARGIN = 20;
const HIDDEN_PATHS = new Set(['/agents/overview', '/workflows']);

interface Position { x: number; y: number }

function readViewport() {
  const visual = window.visualViewport;
  return { width: visual?.width ?? window.innerWidth, height: visual?.height ?? window.innerHeight, left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0 };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function defaultPosition(): Position {
  const viewport = readViewport();
  return constrain({ x: viewport.left + viewport.width - FAB_SIZE - MARGIN, y: viewport.top + viewport.height - FAB_SIZE - MARGIN });
}

function restorePosition(): Position {
  try {
    const value = JSON.parse(localStorage.getItem(POSITION_KEY) ?? '') as Position;
    if (Number.isFinite(value.x) && Number.isFinite(value.y)) return value;
  } catch {
    // Use default position.
  }
  return defaultPosition();
}

function constrain(position: Position): Position {
  const viewport = readViewport();
  const margin = Math.max(0, Math.min(MARGIN, (viewport.width - FAB_SIZE) / 2, (viewport.height - FAB_SIZE) / 2));
  return {
    x: clamp(position.x, viewport.left + margin, viewport.left + Math.max(margin, viewport.width - FAB_SIZE - margin)),
    y: clamp(position.y, viewport.top + margin, viewport.top + Math.max(margin, viewport.height - FAB_SIZE - margin)),
  };
}

export interface FloatingAiAssistantProps {
  embedHostControls?: { expanded: boolean; onClose: () => void; onToggleExpanded: () => void };
  embed?: boolean;
  embedOpenPage?: boolean;
  lockedAgentId?: string | null;
  cameraCaptureEnabled?: boolean;
  cameraCapturePreview?: boolean;
}

export function FloatingAiAssistant({ embedHostControls, embed = false, embedOpenPage = false, lockedAgentId, cameraCaptureEnabled = false, cameraCapturePreview = false }: FloatingAiAssistantProps = {}) {
  const location = useLocation();
  const hidden = !embed && HIDDEN_PATHS.has(location.pathname);
  const pageMode = embed && embedOpenPage;
  const autoOpen = embed && window.self !== window.top;
  const [open, setOpen] = useState(pageMode || autoOpen);
  const [mounted, setMounted] = useState(pageMode || autoOpen);
  const [expanded, setExpanded] = useState(() => localStorage.getItem(EXPANDED_KEY) === '1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewport, setViewport] = useState(readViewport);
  const [position, setPosition] = useState(() => constrain(restorePosition()));
  const positionRef = useRef(position);
  const dragRef = useRef<{ id: number; x: number; y: number; origin: Position; moved: boolean } | null>(null);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => {
    const resize = () => {
      setViewport(readViewport());
      const next = defaultPosition();
      dragRef.current = null;
      positionRef.current = next;
      setPosition(next);
      localStorage.setItem(POSITION_KEY, JSON.stringify(next));
    };
    const scroll = () => {
      setViewport(readViewport());
      setPosition((current) => constrain(current));
    };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('scroll', scroll);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('scroll', scroll);
    };
  }, []);
  useEffect(() => { if (hidden) setOpen(false); }, [hidden]);
  useEffect(() => { if (!open) setSidebarOpen(false); }, [open]);

  const panel = useMemo(() => {
    if (pageMode) return { width: viewport.width, height: viewport.height, left: viewport.left, top: viewport.top };
    const margin = Math.min(MARGIN, viewport.width / 10, viewport.height / 10);
    const maxWidth = Math.max(1, viewport.width - margin * 2);
    const maxHeight = Math.max(1, viewport.height - margin * 2);
    const width = expanded ? Math.min(800, maxWidth) : Math.min(460, maxWidth);
    const height = expanded ? Math.min(820, maxHeight) : Math.min(740, maxHeight);
    return { width, height, left: viewport.left + (expanded ? (viewport.width - width) / 2 : viewport.width - width - margin), top: viewport.top + (viewport.height - height) / 2 };
  }, [expanded, viewport, pageMode]);

  const openPanel = useCallback(() => { setMounted(true); setOpen(true); }, []);
  const closePanel = () => {
    if (embedHostControls) { embedHostControls.onClose(); return; }
    setOpen(false);
    if (embed && window.self !== window.top) {
      window.parent.postMessage({ type: 'agent-open:assistant-close' }, '*');
      try { window.frameElement?.remove(); } catch { /* 跨域 iframe 由宿主监听消息移除。 */ }
      setMounted(false);
    }
  };
  const toggleExpanded = () => setExpanded((value) => {
    const nextExpanded = !value;
    localStorage.setItem(EXPANDED_KEY, nextExpanded ? '1' : '0');
    if (!nextExpanded) setSidebarOpen(false);
    return nextExpanded;
  });

  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: positionRef.current, moved: false };
  };
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    const next = constrain({ x: drag.origin.x + dx, y: drag.origin.y + dy });
    positionRef.current = next;
    setPosition(next);
  };
  const pointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (drag.moved) localStorage.setItem(POSITION_KEY, JSON.stringify(positionRef.current));
    else openPanel();
  };

  if (hidden) return null;
  return (
    <>
      <AnimatePresence>{open && !embed ? <motion.button type="button" aria-label="关闭智能助理" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[200] ${expanded ? 'bg-black/35 backdrop-blur-[2px]' : 'bg-black/10'}`} onClick={closePanel} /> : null}</AnimatePresence>
      {mounted ? (
        <motion.section
          role="dialog"
          aria-label="智能助理"
          aria-hidden={!open}
          {...(!open ? { inert: '' } : {})}
          initial={false}
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.95, pointerEvents: open ? 'auto' : 'none', ...panel }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          className={`fixed z-[210] flex overflow-hidden border border-border bg-background shadow-2xl ${pageMode ? 'rounded-none' : 'rounded-2xl'}`}
          style={embed ? { pointerEvents: open ? 'auto' : 'none' } : undefined}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-18 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-5">
              <div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text"><Sparkles size={20} /></span><div className="min-w-0"><h2 className="text-sm font-semibold">智能助理</h2><p className="mt-0.5 text-xs text-muted-foreground">你的随身工作助手</p></div></div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(value => !value)} aria-label="历史会话" aria-pressed={sidebarOpen}><Menu size={17} /></Button>
                {(!pageMode || embedHostControls) && <Button variant="ghost" size="icon-sm" onClick={embedHostControls?.onToggleExpanded ?? toggleExpanded} aria-label={(embedHostControls?.expanded ?? expanded) ? '还原窗口' : '放大窗口'}>{(embedHostControls?.expanded ?? expanded) ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</Button>}
                <Button variant="ghost" size="icon-sm" onClick={closePanel} aria-label="关闭智能助理窗口"><X size={18} /></Button>
              </div>
            </header>
            <div className="min-h-0 flex-1"><AgentOverviewPage embedded hideToolbar lockedAgentId={lockedAgentId} cameraCaptureEnabled={embed && cameraCaptureEnabled} cameraCapturePreview={embed && cameraCapturePreview} sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} /></div>
          </div>
        </motion.section>
      ) : null}
      <AnimatePresence>{!open && !autoOpen && !pageMode ? (
        <motion.button
          type="button"
          aria-label="打开智能助理"
          title="智能助理（可拖拽）"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: position.x, y: position.y }} exit={{ scale: 0.8, opacity: 0 }}
          className="fixed left-0 top-0 z-[190] flex size-12 touch-none items-center justify-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/10"
          style={embed ? { pointerEvents: 'auto' } : undefined}
          onClick={(event) => { if (event.detail === 0) openPanel(); }}
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { dragRef.current = null; }}
        ><Sparkles size={21} /></motion.button>
      ) : null}</AnimatePresence>
    </>
  );
}
