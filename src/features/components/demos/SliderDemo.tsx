import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export function SliderDemo() {
  const [volume, setVolume] = useState([60]);
  const [range, setRange] = useState([20, 80]);

  return (
    <div className="space-y-8 max-w-sm">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">基础</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>音量</Label>
              <span className="text-muted-foreground">{volume[0]}%</span>
            </div>
            <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">默认值 50</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">区间选择</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>价格区间</Label>
            <span className="text-muted-foreground">¥{range[0]} - ¥{range[1]}</span>
          </div>
          <Slider value={range} onValueChange={setRange} max={100} step={5} />
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">禁用</h3>
        <Slider defaultValue={[40]} disabled />
      </section>
    </div>
  );
}
