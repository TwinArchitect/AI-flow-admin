import { Info, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AlertDemo() {
  return (
    <div className="space-y-4 max-w-lg">
      <Alert>
        <Info size={16} />
        <AlertTitle>提示</AlertTitle>
        <AlertDescription>这是一条普通提示信息，用于告知用户一般性内容。</AlertDescription>
      </Alert>
      <Alert className="border-green-200 text-green-800 [&>svg]:text-green-600">
        <CheckCircle size={16} />
        <AlertTitle>成功</AlertTitle>
        <AlertDescription>操作已成功完成，数据已保存。</AlertDescription>
      </Alert>
      <Alert className="border-yellow-200 text-yellow-800 [&>svg]:text-yellow-600">
        <AlertTriangle size={16} />
        <AlertTitle>警告</AlertTitle>
        <AlertDescription>此操作将影响相关数据，请谨慎操作。</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <XCircle size={16} />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>操作失败，请检查网络连接后重试。</AlertDescription>
      </Alert>
    </div>
  );
}
