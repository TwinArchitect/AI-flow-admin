/* Host-side launcher: only the button and visible chat window receive pointer events. */
(() => {
  const script = document.currentScript;
  if (!script || !script.dataset.src) return;
  const url = new URL(script.dataset.src, script.src);
  if (!['http:', 'https:'].includes(url.protocol)) return;
  const instance = Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join('-');
  url.searchParams.set('mode', 'page');
  url.searchParams.set('embedHost', location.origin);
  url.searchParams.set('embedInstance', instance);
  const number = (value, fallback, min, max) => {
    const parsed = Number(value);
    return value && Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const width = number(script.dataset.width, 420, 280, 1200);
  const height = number(script.dataset.height, 640, 320, 1600);
  const offset = number(script.dataset.offset, 20, 8, 120);
  const zIndex = number(script.dataset.zIndex, 1000, 0, 2147483647);
  const side = script.dataset.position === 'left' ? 'left' : 'right';
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    button { position:fixed; ${side}:${offset}px; bottom:${offset}px; width:56px; height:56px;
      border:0; border-radius:50%; background:var(--assistant-primary, ${script.dataset.primary || 'Highlight'}); color:var(--assistant-primary-foreground, ${script.dataset.primaryForeground || 'HighlightText'}); cursor:pointer;
      font:600 14px system-ui; box-shadow:var(--assistant-shadow, 0 6px 24px rgb(0 0 0 / 20%)); z-index:${zIndex}; }
    button:focus-visible { outline:3px solid var(--assistant-ring, ${script.dataset.ring || 'Highlight'}); outline-offset:3px; }
    iframe { position:fixed; ${side}:${offset}px; bottom:${offset + 68}px;
      width:min(${width}px, calc(100vw - ${offset * 2}px));
      height:min(${height}px, calc(100dvh - ${offset * 2 + 68}px));
      border:0; border-radius:18px; background:Canvas; box-shadow:var(--assistant-shadow, 0 12px 40px rgb(0 0 0 / 20%)); z-index:${zIndex}; }
    iframe[data-expanded="true"] { inset:8px; width:calc(100vw - 16px); height:calc(100dvh - 16px); }
    [hidden] { display:none !important; }
  `;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'AI';
  button.setAttribute('aria-label', '打开智能助理');
  button.setAttribute('aria-expanded', 'false');
  const frame = document.createElement('iframe');
  frame.title = 'AI 智能助理';
  frame.allow = url.searchParams.get('capture') === '1' ? 'clipboard-write; camera; microphone' : 'clipboard-write';
  frame.referrerPolicy = 'no-referrer';
  frame.hidden = true;
  let opened = false;
  let expanded = false;
  const sendState = () => frame.contentWindow?.postMessage({ type: 'assistant:state', instance, expanded }, url.origin);
  const setOpen = (next) => {
    opened = next;
    if (opened && !frame.hasAttribute('src')) frame.src = url.toString();
    frame.hidden = !opened;
    if (!opened) expanded = false;
    frame.dataset.expanded = String(expanded);
    button.hidden = opened && expanded;
    button.textContent = opened ? '关闭' : 'AI';
    button.setAttribute('aria-label', opened ? '关闭智能助理' : '打开智能助理');
    button.setAttribute('aria-expanded', String(opened));
    sendState();
    if (!opened) button.focus();
  };
  button.addEventListener('click', () => setOpen(!opened));
  frame.addEventListener('load', sendState);
  const onMessage = (event) => {
    if (event.origin !== url.origin || event.source !== frame.contentWindow || event.data?.instance !== instance) return;
    if (event.data.type === 'assistant:ready') sendState();
    else if (event.data.type === 'assistant:close') setOpen(false);
    else if (event.data.type === 'assistant:toggle-expanded' && opened) {
      expanded = !expanded;
      frame.dataset.expanded = String(expanded);
      button.hidden = expanded;
      sendState();
    }
  };
  window.addEventListener('message', onMessage);
  shadow.append(style, frame, button);
  const mount = () => {
    document.body.append(host);
    if (script.dataset.open === 'true') setOpen(true);
  };
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
  // SPA hosts can remove the widget and its listener via this custom event.
  script.addEventListener('assistant:destroy', () => {
    document.removeEventListener('DOMContentLoaded', mount);
    window.removeEventListener('message', onMessage);
    host.remove();
  }, { once: true });
})();
