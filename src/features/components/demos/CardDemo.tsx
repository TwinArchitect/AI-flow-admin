import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CardDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>基础卡片</CardTitle>
          <CardDescription>这是卡片的描述信息，可以放在标题下方。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">卡片内容区域，可以放置任意内容。</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm">取消</Button>
          <Button size="sm">确认</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>表单卡片</CardTitle>
          <CardDescription>在卡片中嵌入表单元素。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="card-name">姓名</Label>
            <Input id="card-name" placeholder="请输入姓名" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-email">邮箱</Label>
            <Input id="card-email" type="email" placeholder="请输入邮箱" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button size="sm">提交</Button>
        </CardFooter>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>统计卡片</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[{ label: '活跃用户', value: '1,234' }, { label: '今日执行', value: '567' }, { label: '成功率', value: '98.6%' }].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
