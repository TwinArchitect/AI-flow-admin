import { Label } from '@/components/ui/label';

export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-foreground">{label}</Label>
      {children}
    </div>
  );
}
