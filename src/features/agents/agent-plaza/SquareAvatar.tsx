import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Cog,
  Cpu,
  Factory,
  FileText,
  Globe,
  Headphones,
  Layers,
  MessageCircle,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Users,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import type { SquareAgent } from './squareApi';

const icons: Record<string, typeof Bot> = {
  bot: Bot,
  layers: Layers,
  chat: MessageCircle,
  brain: Brain,
  sparkles: Sparkles,
  cpu: Cpu,
  workflow: Workflow,
  cog: Cog,
  shield: Shield,
  factory: Factory,
  chart: BarChart3,
  doc: FileText,
  search: Search,
  zap: Zap,
  globe: Globe,
  wrench: Wrench,
  book: BookOpen,
  support: Headphones,
  rocket: Rocket,
  team: Users,
};

export function SquareAvatar({ agent }: { agent: Pick<SquareAgent, 'headImg' | 'flowType'> }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (
    agent.headImg &&
    /^(https?:\/\/|data:image\/|blob:|\/)/i.test(agent.headImg) &&
    failed !== agent.headImg
  ) {
    return (
      <img
        src={agent.headImg}
        alt=""
        onError={() => setFailed(agent.headImg ?? null)}
        className="size-12 shrink-0 rounded-xl border border-border object-cover"
      />
    );
  }
  const Icon =
    icons[agent.headImg?.replace(/^agent-avatar:/, '') ?? ''] ??
    (agent.flowType === 0 ? MessageCircle : Layers);
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
      <Icon size={22} />
    </span>
  );
}
