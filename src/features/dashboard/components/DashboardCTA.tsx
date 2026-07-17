import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DashboardCTA() {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-r from-primary via-indigo-600 to-purple-700 text-white rounded-[28px] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
      <div className="space-y-1 relative z-10">
        <h3 className="text-xl md:text-2xl font-black">立即开启属于您企业的智能体之旅</h3>
        <p className="text-xs md:text-sm opacity-90 max-w-xl font-medium">
          点击前往控制台即可创建第一台数字员工智能体，享受 RAG 专业知识检索与高内聚工作流敏捷配置。
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={() => navigate('/agent/overview')}
        className="h-auto px-6 py-3.5 font-black rounded-xl text-xs gap-2 shadow shrink-0 whitespace-nowrap hover:scale-105"
      >
        立即体验 ⚡️
      </Button>
    </section>
  );
}
