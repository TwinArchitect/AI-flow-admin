import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TabsDemo() {
  return (
    <div className="space-y-8 max-w-lg">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
          <TabsTrigger value="disabled" disabled>禁用</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>概览</CardTitle><CardDescription>查看整体数据概况。</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">这里显示概览内容。</p></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader><CardTitle>分析</CardTitle><CardDescription>深入分析各项指标。</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">这里显示分析数据。</p></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>设置</CardTitle><CardDescription>配置相关参数。</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">这里显示设置项。</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
