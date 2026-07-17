/**
 * 测试智能体预设
 * 迁移映射：bg-brand-* → bg-primary, text-brand-* → text-primary
 */

export type TestAgentCustomType =
  | 'data-analysis'
  | 'anti-violation'
  | 'safe-management'
  | 'hazard-analysis';

export interface TestAgentPreset {
  name: string;
  text: string;
  desc: string;
  color: string;
  customType: TestAgentCustomType;
  keywords: string[];
  intro: string;
}

export const TEST_AGENT_PRESETS: TestAgentPreset[] = [
  {
    name: '数据分析智能体',
    text: '近7天电厂进出人数统计',
    desc: '看趋势分析',
    color:
      'text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border-blue-200 dark:border-blue-500/30',
    customType: 'data-analysis',
    keywords: ['近7天电厂进出人数统计', '进出人数', '电厂人数'],
    intro:
      '您好！作为【数据分析智能体】，我已从厂区实名刷卡与数字孪生考勤系统为您调取了近7天（05-27 至 06-02）的电厂人员实名进出数据。以下是详细的趋势统计与波动分析：'
  },
  {
    name: '安全管理智能体',
    text: '十条禁令有哪些',
    desc: '查安全制度',
    color:
      'text-orange-500 bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 border-orange-200 dark:border-orange-500/30',
    customType: 'safe-management',
    keywords: ['十条禁令有哪些', '十条禁令'],
    intro:
      '您好！作为【安全管理智能体】，依据最新的国家电力安全生产规范及红线指令，我为您整理出"防人身伤害十条禁令"的详细核心细则：'
  },
  {
    name: '反违章智能体',
    text: '今日违章主要有哪些',
    desc: '析现场违错',
    color:
      'text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border-rose-200 dark:border-rose-500/30',
    customType: 'anti-violation',
    keywords: ['今日违章主要有哪些', '主要违章', '违章主要有哪些'],
    intro:
      '您好！作为【反违章智能体】，今日通过现场高清安防AI摄像头的智能违章行为检测模块，共识别捕获不合规行为作业 12 起。以下是今日各项违章事件在不同类型、级别分布上的具体数据统计图：'
  }
];

/** 额外演示：安全隐患分析（无快捷按钮，仍可通过关键词触发） */
const HAZARD_PRESET: Pick<TestAgentPreset, 'customType' | 'keywords' | 'intro'> = {
  customType: 'hazard-analysis',
  keywords: ['安全隐患', '隐患', '有哪些安全隐患'],
  intro:
    '您好！作为【安全隐患分析智能体】，已对您提交的照片或问询场站细节进行了高维度的多模态神经网络特征解码。以下为您生成精准隐患位置锚框与符合规章制度法理性的深度研判报告：'
};

export function matchTestAgent(input: string): Pick<TestAgentPreset, 'customType' | 'intro'> | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  for (const preset of TEST_AGENT_PRESETS) {
    if (preset.keywords.some((kw) => trimmed.includes(kw))) {
      return { customType: preset.customType, intro: preset.intro };
    }
  }
  if (HAZARD_PRESET.keywords.some((kw) => trimmed.includes(kw))) {
    return { customType: HAZARD_PRESET.customType, intro: HAZARD_PRESET.intro };
  }
  return null;
}

export function resolveCustomTypeFromQuestion(question: string): TestAgentCustomType | undefined {
  return matchTestAgent(question)?.customType;
}
