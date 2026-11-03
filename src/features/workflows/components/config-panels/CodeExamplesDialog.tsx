import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CODE_EXAMPLES, PYTHON_CODE_EXAMPLES } from '../../utils/codeExamples';

export function CodeExamplesDialog({ language = 'js', open, onOpenChange, onSelect }: {
  language?: 'js' | 'py';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (code: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>代码示例</DialogTitle>
          <DialogDescription>选择示例后会替换当前代码。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {(language === 'py' ? PYTHON_CODE_EXAMPLES : CODE_EXAMPLES).map((example) => (
            <Button
              key={example.title}
              type="button"
              variant="outline"
              className="h-auto items-start justify-start whitespace-normal p-4 text-left"
              onClick={() => { onSelect(example.code); onOpenChange(false); }}
            >
              <span><span className="block font-medium">{example.title}</span><span className="mt-1 block text-xs text-muted-foreground">{example.description}</span></span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
