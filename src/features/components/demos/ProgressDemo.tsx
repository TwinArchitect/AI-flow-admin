import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export function ProgressDemo() {
  const [value, setValue] = useState(33);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!animating) return;
    if (value >= 100) { setAnimating(false); return; }
    const t = setTimeout(() => setValue((v) => Math.min(v + 10, 100)), 300);
    return () => clearTimeout(t);
  }, [animating, value]);

  return (
    <div className="space-y-6 max-w-sm">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">静态示例</h3>
        <div className="space-y-3">
          {[{ label: '上传进度', value: 33 }, { label: '任务完成', value: 66 }, { label: '存储使用', value: 90 }].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.value}%</span>
              </div>
              <Progress value={item.value} className={item.value >= 90 ? '[&>div]:bg-destructive' : ''} />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">动态演示</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>进度</span>
            <span className="text-muted-foreground">{value}%</span>
          </div>
          <Progress value={value} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setValue(0); setAnimating(true); }}>重置并播放</Button>
            <Button size="sm" variant="outline" onClick={() => setValue(100)}>跳至 100%</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
