import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { Notification } from '@/types/notification';

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'success',
    title: '智能体部署成功',
    desc: '客服支持机器人 v1.2 已成功发布上线',
    time: '2 分钟前',
    unread: true,
  },
  {
    id: 'n2',
    type: 'info',
    title: '知识库更新完成',
    desc: '产品手册新版本切片处理完成，共 156 个片段',
    time: '15 分钟前',
    unread: true,
  },
  {
    id: 'n3',
    type: 'warning',
    title: 'API 调用量告警',
    desc: '本月 API 调用量已达配额的 85%，建议升级套餐',
    time: '1 小时前',
    unread: true,
  },
  {
    id: 'n4',
    type: 'info',
    title: '系统维护通知',
    desc: '平台将于 6月28日 凌晨 2:00-4:00 进行维护升级',
    time: '3 小时前',
    unread: false,
  },
  {
    id: 'n5',
    type: 'success',
    title: '工作流测试通过',
    desc: '数据抽取流水线全部测试用例通过',
    time: '昨天',
    unread: false,
  },
];

export const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
};
