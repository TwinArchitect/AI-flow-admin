import { BarChart3, BookOpen, Bot, Brain, Check, Cog, Cpu, Factory, FileText, Globe, Headphones, Layers, MessageCircle, Rocket, Search, Shield, Sparkles, Users, Workflow, Wrench, Zap } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const options = [
  { id: 'bot', label: '机器人', icon: Bot, color: 'text-indigo-600 bg-indigo-100' },
  { id: 'layers', label: '工作流', icon: Layers, color: 'text-violet-600 bg-violet-100' },
  { id: 'chat', label: '对话', icon: MessageCircle, color: 'text-sky-600 bg-sky-100' },
  { id: 'brain', label: '智慧', icon: Brain, color: 'text-purple-600 bg-purple-100' },
  { id: 'sparkles', label: '灵感', icon: Sparkles, color: 'text-amber-600 bg-amber-100' },
  { id: 'cpu', label: '算力', icon: Cpu, color: 'text-slate-600 bg-slate-100' },
  { id: 'workflow', label: '编排', icon: Workflow, color: 'text-emerald-600 bg-emerald-100' },
  { id: 'cog', label: '配置', icon: Cog, color: 'text-zinc-600 bg-zinc-100' },
  { id: 'shield', label: '安全', icon: Shield, color: 'text-rose-600 bg-rose-100' },
  { id: 'factory', label: '工业', icon: Factory, color: 'text-orange-600 bg-orange-100' },
  { id: 'chart', label: '分析', icon: BarChart3, color: 'text-cyan-600 bg-cyan-100' },
  { id: 'doc', label: '文档', icon: FileText, color: 'text-teal-600 bg-teal-100' },
  { id: 'search', label: '检索', icon: Search, color: 'text-blue-600 bg-blue-100' },
  { id: 'zap', label: '效率', icon: Zap, color: 'text-yellow-600 bg-yellow-100' },
  { id: 'globe', label: '联网', icon: Globe, color: 'text-lime-600 bg-lime-100' },
  { id: 'wrench', label: '工具', icon: Wrench, color: 'text-stone-600 bg-stone-100' },
  { id: 'book', label: '知识', icon: BookOpen, color: 'text-fuchsia-600 bg-fuchsia-100' },
  { id: 'support', label: '客服', icon: Headphones, color: 'text-pink-600 bg-pink-100' },
  { id: 'rocket', label: '创新', icon: Rocket, color: 'text-indigo-500 bg-indigo-100' },
  { id: 'team', label: '协同', icon: Users, color: 'text-emerald-500 bg-emerald-100' },
] as const;

export function ChatAgentAvatarPicker({ headImg, onChange }: { headImg: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => headImg === `agent-avatar:${option.id}`) ?? options[0];
  const CurrentIcon = current.icon;
  const remote = /^(https?:\/\/|data:image\/|blob:|\/)/i.test(headImg.trim());
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label="选择智能体头像" className={`flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-border ${remote ? 'bg-muted' : current.color}`}>
          {remote ? <img src={headImg} alt="智能体头像" className="size-full object-cover" /> : <CurrentIcon size={30} />}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>选择头像</DialogTitle></DialogHeader>
        <div className="grid grid-cols-5 gap-2">
          {options.map((option) => {
            const Icon = option.icon;
            const selected = headImg === `agent-avatar:${option.id}`;
            return <button key={option.id} type="button" title={option.label} aria-label={option.label} aria-pressed={selected} className={`relative flex aspect-square items-center justify-center rounded-xl ${option.color} ${selected ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'}`} onClick={() => { onChange(`agent-avatar:${option.id}`); setOpen(false); }}><Icon size={20} />{selected && <Check size={12} className="absolute right-0.5 top-0.5" />}</button>;
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
