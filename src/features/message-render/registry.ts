import type { ComponentType } from 'react';
import type { MessageBlock, RenderContext } from '@/types';

export interface BlockRendererProps<T extends MessageBlock = MessageBlock> {
  block: T;
  ctx: RenderContext;
}

export interface BlockRenderer<T extends MessageBlock = MessageBlock> {
  type: T['type'];
  kind?: string;
  Component: ComponentType<BlockRendererProps<T>>;
}

const renderers = new Map<string, BlockRenderer>();
const rendererKey = (type: string, kind?: string) => (kind ? `${type}:${kind}` : type);

export function registerBlockRenderer<T extends MessageBlock>(renderer: BlockRenderer<T>) {
  renderers.set(
    rendererKey(renderer.type, renderer.kind),
    renderer as unknown as BlockRenderer,
  );
}

export function getBlockRenderer(block: MessageBlock): BlockRenderer | undefined {
  if (block.type === 'custom') {
    return renderers.get(rendererKey('custom', block.kind)) ?? renderers.get('custom');
  }
  return renderers.get(rendererKey(block.type));
}

export function listBlockRenderers() {
  return Array.from(renderers.values());
}
