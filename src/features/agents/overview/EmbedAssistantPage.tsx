import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { parseEmbedHost } from './embedSnippet';
import { applyEmbedAuthFromSearch } from './embedAuth';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';

export function EmbedAssistantPage() {
  const { search } = useLocation();
  const auth = useMemo(() => applyEmbedAuthFromSearch(search), [search]);
  const host = useMemo(() => parseEmbedHost(search, window.parent !== window), [search]);
  const [hostExpanded, setHostExpanded] = useState(false);
  const notifyHost = (type: string) => {
    if (host) window.parent.postMessage({ type, instance: host.instance }, host.origin);
  };
  useEffect(() => {
    if (!host) return;
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== host.origin || event.data?.instance !== host.instance) return;
      if (event.data.type === 'assistant:state') setHostExpanded(Boolean(event.data.expanded));
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ type: 'assistant:ready', instance: host.instance }, host.origin);
    return () => window.removeEventListener('message', receive);
  }, [host]);
  useEffect(() => {
    const elements = [document.documentElement, document.body, document.getElementById('root')].filter((element): element is HTMLElement => Boolean(element));
    const previous = elements.map((element) => ({ element, background: element.style.background, pointerEvents: element.style.pointerEvents, overflow: element.style.overflow }));
    elements.forEach((element) => { element.style.background = 'transparent'; element.style.pointerEvents = 'none'; element.style.overflow = 'hidden'; });
    return () => previous.forEach(({ element, ...styles }) => Object.assign(element.style, styles));
  }, []);
  if (!auth.ok) return <div className="flex min-h-dvh items-center justify-center p-6" style={{ pointerEvents: 'auto' }}><div className="rounded-xl border border-destructive/30 bg-background p-5 text-sm"><h1 className="font-semibold">无法加载智能助理</h1><p className="mt-2 text-destructive">{auth.message}</p></div></div>;
  return <FloatingAiAssistant key={search} embedHostControls={host ? { expanded: hostExpanded, onClose: () => notifyHost('assistant:close'), onToggleExpanded: () => notifyHost('assistant:toggle-expanded') } : undefined} embed embedOpenPage={auth.openPage} lockedAgentId={auth.appId} cameraCaptureEnabled={auth.captureEnabled} cameraCapturePreview={auth.capturePreview} />;
}
