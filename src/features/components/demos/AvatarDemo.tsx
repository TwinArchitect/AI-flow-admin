import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AvatarDemo() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">尺寸</h3>
        <div className="flex items-end gap-4">
          <Avatar className="h-6 w-6"><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
          <Avatar className="h-8 w-8"><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
          <Avatar className="h-10 w-10"><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
          <Avatar className="h-12 w-12"><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
          <Avatar className="h-16 w-16"><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Fallback</h3>
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10"><AvatarFallback>张</AvatarFallback></Avatar>
          <Avatar className="h-10 w-10"><AvatarFallback>李四</AvatarFallback></Avatar>
          <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback></Avatar>
          <Avatar className="h-10 w-10"><AvatarFallback className="bg-green-500 text-white">OK</AvatarFallback></Avatar>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">头像组</h3>
        <div className="flex -space-x-3">
          {['CN', '张', '李', '王', '+5'].map((text, i) => (
            <Avatar key={i} className="h-9 w-9 border-2 border-background">
              <AvatarFallback className="text-xs">{text}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </section>
    </div>
  );
}
