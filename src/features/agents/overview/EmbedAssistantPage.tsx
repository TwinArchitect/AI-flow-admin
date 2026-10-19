import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { applyEmbedAuthFromSearch } from './embedAuth';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';

export function EmbedAssistantPage() {
  const { search } = useLocation();
  const auth = useMemo(() => applyEmbedAuthFromSearch(search), [search]);
  useEffect(() => {
    const elements = [document.documentElement, document.body, document.getElementById('root')].filter((element): element is HTMLElement => Boolean(element));
    const previous = elements.map((element) => ({ element, background: element.style.background, pointerEvents: element.style.pointerEvents, overflow: element.style.overflow }));
    elements.forEach((element) => { element.style.background = 'transparent'; element.style.pointerEvents = 'none'; element.style.overflow = 'hidden'; });
    return () => previous.forEach(({ element, ...styles }) => Object.assign(element.style, styles));
  }, []);
  if (!auth.ok) return <div className="flex min-h-dvh items-center justify-center p-6" style={{ pointerEvents: 'auto' }}><div className="rounded-xl border border-destructive/30 bg-background p-5 text-sm"><h1 className="font-semibold">无法加载智能助理</h1><p className="mt-2 text-destructive">{auth.message}</p></div></div>;
  return <FloatingAiAssistant key={search} embed embedOpenPage={auth.openPage} lockedAgentId={auth.appId} cameraCaptureEnabled={auth.captureEnabled} cameraCapturePreview={auth.capturePreview} />;
}
