export const TEMPLATE_EXAMPLES = [
  {
    title: '多变量问候', description: '组合用户名称与正文内容', inputKeys: ['customer', 'body'],
    template: 'Hi {{ customer }},\n\n{{ body }}\n\n---\nBest regards',
  },
  {
    title: '条件分支', description: '根据 VIP 状态输出不同文案', inputKeys: ['order'],
    template: '{% if order.is_vip %}\n尊敬的 VIP 会员 {{ order.customer }}，\n{% else %}\n亲爱的 {{ order.customer }}，\n{% endif %}\n\n订单金额：¥{{ order.amount | round(2) }}',
  },
  {
    title: '列表循环', description: '遍历检索结果生成 Markdown 列表', inputKeys: ['results'],
    template: '{% for item in results %}\n### 结果 {{ loop.index }}\n**得分**: {{ item.score | round(2) }}\n{{ item.content }}\n---\n{% endfor %}',
  },
  {
    title: '过滤器与默认值', description: '格式化与缺失值兜底', inputKeys: ['name', 'tags', 'score'],
    template: "姓名：{{ name | upper }}\n标签：{{ tags | join(', ') | default('无') }}\n得分：{{ score | default('未评分') }}",
  },
];
