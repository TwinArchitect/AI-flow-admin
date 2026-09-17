import {
  DATA_TABLE_BLOCK_KIND,
  ECHARTS_BLOCK_KIND,
  QUESTION_GUIDE_BLOCK_KIND,
  REFERENCE_IMAGES_BLOCK_KIND,
  REFERENCE_BLOCK_KIND,
} from './richContent';
import { registerBlockRenderer } from './registry';
import {
  AttachmentBlockRenderer,
  CustomBlockFallback,
  HtmlBlockRenderer,
  ImageBlockRenderer,
  KnownCustomBlockRenderer,
  MarkdownBlockRenderer,
  ReasoningBlockRenderer,
  TextBlockRenderer,
} from './DefaultBlockRenderers';

let registered = false;

export function registerDefaultRenderers() {
  if (registered) return;
  registered = true;
  registerBlockRenderer({ type: 'text', Component: TextBlockRenderer });
  registerBlockRenderer({ type: 'markdown', Component: MarkdownBlockRenderer });
  registerBlockRenderer({ type: 'reasoning', Component: ReasoningBlockRenderer });
  registerBlockRenderer({ type: 'html', Component: HtmlBlockRenderer });
  registerBlockRenderer({ type: 'image', Component: ImageBlockRenderer });
  registerBlockRenderer({ type: 'custom', kind: 'attachment', Component: AttachmentBlockRenderer });
  for (const kind of [ECHARTS_BLOCK_KIND, DATA_TABLE_BLOCK_KIND, REFERENCE_BLOCK_KIND, REFERENCE_IMAGES_BLOCK_KIND, QUESTION_GUIDE_BLOCK_KIND]) {
    registerBlockRenderer({ type: 'custom', kind, Component: KnownCustomBlockRenderer });
  }
  registerBlockRenderer({ type: 'custom', Component: CustomBlockFallback });
}
