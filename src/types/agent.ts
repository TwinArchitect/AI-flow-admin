export interface Agent {
  id: string;
  name: string;
  model: string;
  desc: string;
  tags: string[];
  iconType: string;
  iconBg: string;
  iconColor: string;
  calls: number;
  successRate: string;
  status: 'running' | 'paused' | 'error';
  updatedAt: string;
}
