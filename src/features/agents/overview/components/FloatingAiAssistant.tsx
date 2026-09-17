import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Menu, Minimize2, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { AgentOverviewPage } from '../AgentOverviewPage';

const POSITION_KEY = 'floating_ai_assistant_pos';
const EXPANDED_KEY = 'floating_ai_assistant_expanded';
const FAB_SIZE = 48;
const MARGIN = 20;
const HIDDEN_PATHS = new Set(['/agents/overview', '/workflows']);

interface Position { x: number; y: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function defaultPosition(): Position {
  return { x: window.innerWidth - FAB_SIZE - MARGIN, y: window.innerHeight - FAB_SIZE - MARGIN };
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
  return {
    x: clamp(position.x, MARGIN, Math.max(MARGIN, window.innerWidth - FAB_SIZE - MARGIN)),
    y: clamp(position.y, MARGIN, Math.max(MARGIN, window.innerHeight - FAB_SIZE - MARGIN)),
  };
}

export function FloatingAiAssistant() {
  const location = useLocation();
  const hidden = HIDDEN_PATHS.has(location.pathname);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(() => localStorage.getItem(EXPANDED_KEY) === '1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [position, setPosition] = useState(() => constrain(restorePosition()));
  const positionRef = useRef(position);
  const dragRef = useRef<{ id: number; x: number; y: number; origin: Position; moved: boolean } | null>(null);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => {
    const resize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setPosition((current) => constrain(current));
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => { if (hidden) setOpen(false); }, [hidden]);
  useEffect(() => { if (!open) setSidebarOpen(false); }, [open]);

  const panel = useMemo(() => {
    const maxWidth = viewport.width - MARGIN * 2;
    const maxHeight = viewport.height - MARGIN * 2;
    const width = expanded ? Math.min(800, maxWidth) : Math.min(440, maxWidth);
    const height = expanded ? Math.min(820, maxHeight) : Math.min(620, maxHeight);
    return { width, height, left: expanded ? (viewport.width - width) / 2 : viewport.width - width - MARGIN, top: (viewport.height - height) / 2 };
  }, [expanded, viewport]);

  const openPanel = useCallback(() => { setMounted(true); setOpen(true); }, []);
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
    setPosition(constrain({ x: drag.origin.x + dx, y: drag.origin.y + dy }));
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
      <AnimatePresence>{open ? <motion.button type="button" aria-label="关闭智能助理" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[200] ${expanded ? 'bg-black/35 backdrop-blur-[2px]' : 'bg-black/10'}`} onClick={() => setOpen(false)} /> : null}</AnimatePresence>
      {mounted ? (
        <motion.section
          role="dialog"
          aria-label="智能助理"
          initial={false}
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.95, pointerEvents: open ? 'auto' : 'none', ...panel }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          className="fixed z-[210] flex overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-3 backdrop-blur">
              <button type="button" onClick={() => setSidebarOpen((value) => !value)} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" title="历史会话"><Menu size={19} /></button>
              <h2 className="pointer-events-none absolute inset-x-0 text-center text-sm font-semibold">智能助理</h2>
              <div className="z-10 flex items-center">
                <button type="button" onClick={toggleExpanded} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" title={expanded ? '还原窗口' : '放大窗口'}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
                <button type="button" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" title="关闭"><X size={19} /></button>
              </div>
            </header>
            <div className="min-h-0 flex-1"><AgentOverviewPage embedded hideToolbar sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} /></div>
          </div>
        </motion.section>
      ) : null}
      <AnimatePresence>{!open ? (
        <motion.button
          type="button"
          aria-label="打开智能助理"
          title="智能助理（可拖拽）"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: position.x, y: position.y }} exit={{ scale: 0.8, opacity: 0 }}
          className="fixed left-0 top-0 z-[190] flex size-12 touch-none items-center justify-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(99,102,241,0.35)]"
          onClick={openPanel}
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
        ><Sparkles size={21} /></motion.button>
      ) : null}</AnimatePresence>
    </>
  );
}
