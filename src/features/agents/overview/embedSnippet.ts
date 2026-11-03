export function buildEmbedAssistantSnippet(options: {
  origin: string;
  appId?: string;
  openPage?: boolean;
  captureEnabled?: boolean;
  primary?: string;
  primaryForeground?: string;
  ring?: string;
}) {
  const origin = new URL(options.origin).origin;
  const params = new URLSearchParams({ token: 'YOUR_USER_TOKEN', mode: 'page' });
  if (options.appId) params.set('appId', options.appId);
  if (options.captureEnabled) params.set('capture', '1');
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<script data-ai-assistant
  src="${escape(origin)}/assistant-embed.js"
  data-src="${escape(`${origin}/embed/assistant?${params}`)}"
  data-width="420"
  data-height="640"
  data-position="right"
  data-z-index="1000"
  data-open="${Boolean(options.openPage)}"
  data-primary="${escape(options.primary || 'Highlight')}"
  data-primary-foreground="${escape(options.primaryForeground || 'HighlightText')}"
  data-ring="${escape(options.ring || 'Highlight')}"
  defer
></script>`;
}

export function parseEmbedHost(search: string, embedded: boolean) {
  if (!embedded) return null;
  const params = new URLSearchParams(search);
  const origin = params.get('embedHost');
  const instance = params.get('embedInstance');
  if (!origin || !instance) return null;
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === origin ? { origin, instance } : null;
  } catch { return null; }
}
