import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function AccordionDemo() {
  return (
    <div className="space-y-8 max-w-lg">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">单选展开</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>什么是 AI Flow？</AccordionTrigger>
            <AccordionContent>AI Flow 是一个智能工作流编排平台，支持可视化构建复杂的 AI 处理流程。</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>如何创建工作流？</AccordionTrigger>
            <AccordionContent>点击「新建工作流」按钮，在画布上拖拽节点并连接，完成后保存即可。</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>支持哪些 AI 模型？</AccordionTrigger>
            <AccordionContent>目前支持 OpenAI GPT 系列、Claude、Gemini 等主流大语言模型。</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">多选展开</h3>
        <Accordion type="multiple">
          <AccordionItem value="a">
            <AccordionTrigger>数据安全</AccordionTrigger>
            <AccordionContent>所有数据均经过加密传输和存储，符合企业级安全标准。</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>权限管理</AccordionTrigger>
            <AccordionContent>支持基于角色的访问控制（RBAC），可细粒度配置每个用户的操作权限。</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
