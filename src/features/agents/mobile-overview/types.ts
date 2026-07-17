export type PhoneTheme = 'iphone-light' | 'iphone-dark' | 'huaneng-blue';

export type MessageCustomType = 'data-analysis' | 'anti-violation' | 'safe-management';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  customType?: MessageCustomType;
}

export interface Prohibition {
  num: string;
  title: string;
  desc: string;
}

export interface Citation {
  title: string;
  code: string;
}

export interface ChartDataPoint {
  date: string;
  进站: number;
  出站: number;
}

export interface ViolationItem {
  name: string;
  value: number;
  color: string;
}

export interface QuickAction {
  label: string;
  prompt: string;
  desc: string;
}
