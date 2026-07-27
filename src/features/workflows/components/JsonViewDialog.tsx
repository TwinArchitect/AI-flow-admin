import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function JsonViewDialog({
  open,
  onOpenChange,
  title,
  description,
  value,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: unknown;
}) {
  const text = JSON.stringify(value, null, 2);

  async function copyJson() {
    await navigator.clipboard.writeText(text);
    toast.success('JSON 已复制');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <pre className="min-h-0 flex-1 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
          {text}
        </pre>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void copyJson()}>
            <Copy size={14} />
            复制 JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
