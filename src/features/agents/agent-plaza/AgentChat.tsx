import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Send,
  Eye,
  Download,
  Activity,
  CheckCircle2,
  ArrowRight,
  User,
  Bot,
  ShieldAlert,
  FileText,
  FileCheck,
  Presentation,
  HelpCircle,
  Check,
  AlertCircle,
  Settings,
  Gauge,
  Wrench,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ====== 智能体配置类型 ======

interface AgentProfile {
  title: string;
  desc: string;
  category: string;
  views: string;
  copies: string;
  accuracy: string;
  baseModel: string;
  systemPrompt: string;
  scenario: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  presetQuestions: string[];
  presetAnswers: Record<string, string>;
}

// ====== 智能体数据（对应原型） ======

const agentsData: Record<string, AgentProfile> = {
  '基础法律问答助手': {
    title: '基础法律问答助手',
    desc: '基础法律知识的智能问答助手，基于现行法律法规、司法解释及权威案例为基础解决日常合规诉求。',
    category: '办公',
    views: '11758',
    copies: '4973',
    accuracy: '98.8%',
    baseModel: 'Huaneng-Llama3-Industrial-8B',
    systemPrompt:
      '你是系统配置的法律顾问智能体。你通晓中华人民共和国合同法、劳动法、民法典等相关条文及司法解释。请仅基于现行有效法律与最高院典型案例进行高精确性答复，若因事实不清，需提示法律边界风险。',
    scenario: '适用于集团各级子公司法务点检、日常非诉问答、采购合同法务初审等前置环节。',
    icon: BookOpen,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    presetQuestions: [
      '合同中违约金一般最高不能超过主合同金额的百分之多少？',
      '不可抗力免责条款在雷击电网事故中如何界定？',
      '采购合同中约定争议管辖地一般如何设计降低诉讼成本？',
    ],
    presetAnswers: {
      '合同中违约金一般最高不能超过主合同金额的百分之多少？':
        '根据有关司法解释和合同法基本原理：\n1. 约定的违约金**一般不应超过实际损失的30%**。\n2. 超过的部分，当事人可以请求人民法院或者仲裁机构予以适当减少。最高人民法院关于适用《中华人民共和国民法典》合同编的解释中，对于违约金过高的衡量标准，通常也是以**造成的损失**为基准，超过造成的损失30%的，一般可以认定为民法典第五百八十五条第二款规定的"过分高于造成的损失"。',
      '不可抗力免责条款在雷击电网事故中如何界定？':
        '雷击电网事故在司法实践中的界定标准如下：\n1. **自然灾害属性认定**：强雷击事件通常被认定为不可抗力（无法预见、无法避免且无法克服的自然灾害）。\n2. **免责审查死角**：电厂或输电单位必须提供充足证据，证明其防雷避雷设施符合国家《交流电气装置的过电压保护和绝缘配合》（GB/T 50064）设计标准且点检正常。若因防雷设施失修导致的次生短路，则只能算"多因一果"，不构成全额不可抗力免责。\n3. **合同通知义务**：事故发生后必须在合同约定时间内（如3天内）向合同相对方送达《雷电事故不可抗力通知书》及当地气象局出具的防雷中心雷电监测报告。',
      '采购合同中约定争议管辖地一般如何设计降低诉讼成本？':
        '争议管辖条款的设计是防范异地诉讼高昂成本的关键：\n1. **首选原告住所地管辖**："本合同履行发生争议的，由起诉方/原告住所地有管辖权的人民法院管辖"。这有利于掌握起诉主动权，避免长途外派差旅、聘请异地律师。\n2. **次选特定直属管辖**：若双方僵持，可约定"合同签署地、合同履行地、被告住所地"中对己方最便利的市区法院管辖。避免"由双方所在地任意法院管辖"之类的模糊死锁条款。',
    },
  },
  '合同信息抽取': {
    title: '合同信息抽取',
    desc: '本应用能够从合同文本中精准提取关键要素，包括合作主体、签署时间、核心标的及约束条款等。',
    category: '办公',
    views: '5360',
    copies: '5274',
    accuracy: '99.2%',
    baseModel: 'Qwen2.5-72B-Instruct',
    systemPrompt:
      '你是一名具有极高准确率的合同文本抽取专家。请使用结构化JSON或标准多级表格，从输入合同文本中无一遗漏地挑出：【签署甲乙方全称】、【合同总价及币种】、【履行期限】、【交付标准】、【核心免责及违约条款】以及【争议管辖法院】。',
    scenario: '处理大宗备品备件采购合同、租赁合同、建安工程承包协议的结构化批量归账与审计检索。',
    icon: FileCheck,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    presetQuestions: [
      '请对以下合同草案进行即时关键信息抽取演示：',
      '如何快速校验提取出的合同主体是否与国家企业信用网登记一致？',
    ],
    presetAnswers: {
      '请对以下合同草案进行即时关键信息抽取演示：':
        '### 📂 合同文本结构化抽取报告\n\n| 要素大类 | 字段提取值 | 规则状态 | 深度解析 |\n| :--- | :--- | :--- | :--- |\n| **合同名称** | 2026年度3号超超临界机组凝结水泵配件采购协议网页版 | 匹配成功 | 标准物资采购 |\n| **买方(甲方)** | 智创神州（北京）新能源有限公司 | 在册主体 | 华能全资孙公司 |\n| **卖方(乙方)** | 东方泵业精密制造（苏州）集团股份公司 | 非黑名单 | 一般纳税人 |\n| **合同总价** | RMB ￥1,420,000.00 元（大写：壹佰肆拾贰万元整） | 税率13% | 闭口总价，包含到货运保费 |\n| **交付限时** | 2026年9月15日前一次性交付至场站一号仓库 | 无滞后 | 提前5天需提供书面到货预约 |\n| **争议解决** | 提请北京仲裁委员会进行仲裁，采用简易程序 | 约定有效 | 降低了诉讼周期 |',
      '如何快速校验提取出的合同主体是否与国家企业信用网登记一致？':
        '信息抽取智能体可通过联动外部Plugin进行：\n1. **国家企业信用信息公示系统API联动**：后台提取出乙方全称后，自动发送GET请求验证乙方存续状态（存续、在册、注销）。\n2. **法定代表人校验**：抽取合同签章页的法定表决代理人名称，与工商系统自动碰撞，防范超范围授权或假公章签署。\n3. **失信联合惩戒筛查**：同步自动排查中国执行信息公开网，发现失信或列为被执行人时一键标红阻断发网审批。',
    },
  },
  'PPT 自动生成': {
    title: 'PPT 自动生成',
    desc: '本模板适用于快速制作结构清晰、内容专业的演示文稿，广泛应用于工作周报汇报及经营分析会。',
    category: '办公',
    views: '182142',
    copies: '3651',
    accuracy: '97.5%',
    baseModel: 'DeepSeek-V2.5-Chat',
    systemPrompt:
      '你是演示文稿（Markdown PPT / Presentation）架构设计智能体。你将根据用户输入的主题，规划高大上的汇报大纲，给出每一页PPT的精简标题、分项观点（Bullet Points），以及推荐的排版格局（如并列排、对比排、演进排）。格式必须使用严格的 [Slide 1] 标注以便外部渲染引擎读取。',
    scenario: '快速制作月度值班概况、季度安全演练工作总结、大项目汇报、数字化场站转型演进幻灯片。',
    icon: Presentation,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    presetQuestions: [
      '帮我规划一版《某百万机组集控安全生产百日无事故汇报》PPT大纲。',
      '如何导出为你设计的PPT？支持哪些格式？',
    ],
    presetAnswers: {
      '帮我规划一版《某百万机组集控安全生产百日无事故汇报》PPT大纲。':
        '### 📊 安全百日无事故汇报 PPT 策划案\n\n---\n\n#### 🎬 [Slide 1] 封面：砥砺坚守，安若磐石\n- **主标题**：某百万千瓦火电机组集控室安全运行100天卓越汇编\n- **副标题**：防微杜渐 · 精益运行 · 守护光明\n- **演讲人**：集控值班主任\n- **视觉建议**：深蔚蓝色背景，居中高对比白色亮字，极简科技光带。\n\n---\n\n#### 🎯 [Slide 2] 核心数据：100天丰碑图册\n- **关键指标1**：安全安全天数：累计 100 天 （连续无异常断网事故）\n- **关键指标2**：安全发电总量：7.24 亿千瓦时，负荷率稳步维持于78%\n- **关键指标3**：两票规范合格率：100%（累计办理工作票 2,140 张）\n- **排版建议**：三栏式"数据卡片Bento布局"，卡片边缘带极浅发光投影。\n\n---\n\n#### 🔍 [Slide 3] 攻坚举措：筑牢立体防御屏障\n- **举措A：双防一检三查**：严格按照安规，深化场站巡屏和隐患分级过滤。\n- **举措B：动态配煤掺烧优化**：规避超温结焦事件，实现能耗最优寻优配置。\n- **举措C：反事故红蓝高强度演练**：累计开展防汛和高低温突发应急预演3次。\n- **排版建议**：使用向右延伸的流程轴（Timeline Flow）。',
      '如何导出为你设计的PPT？支持哪些格式？':
        '转换流程极度便捷：\n1. **一键生成Markdown标准体**：我已将大纲结构封装为兼容Slidev和Marp的Markdown表达方式。\n2. **格式一：原生PPTX**：点击下方"格式重构"按钮，平台会自动渲染并导出标准可编辑的微软 PowerPoint (.pptx) 文件，内置了华能蓝白工业标准版一整套UI模版。\n3. **格式二：PDF/HTML**：支持导出用于网页投影的交互HTML包及高保真打印级PDF。',
    },
  },
  '日常作业违规AI智能抓拍': {
    title: '日常作业违规AI智能抓拍',
    desc: '自动辨别场站监控中各类越界和不规范操作，如未穿工作服、未戴防尘面罩等并一键报警。',
    category: '安全',
    views: '12550',
    copies: '4122',
    accuracy: '98.4%',
    baseModel: 'Huaneng-Vision-YOLOv9-Edge',
    systemPrompt:
      '你是安全监督与视觉大模型判定智能体。你通晓电网安全工作规程、安委会五不两票监督。请对输入画面或动作描述进行违章类型定性、列出对应违章条款，并给出整改指引，用词需严肃专业。',
    scenario: '结合场站、高压室、升压站现场摄像头实时违章捕捉，进行闭环处置和安全稽查建档。',
    icon: ShieldAlert,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    presetQuestions: [
      '画面中：两人在锅炉补水系统区脚手架作业，其中一名工人将安全绳解开并搭在防护护栏上，怎么认定？',
      '怎么在管理看板上配置，才可以将AI抓拍和场站广播大喇叭报警实时联动？',
    ],
    presetAnswers: {
      '画面中：两人在锅炉补水系统区脚手架作业，其中一名工人将安全绳解开并搭在防护护栏上，怎么认定？':
        '### 🚨 生产安监危险事件研判书\n\n- **违章定性**：**高处作业脱锚挂（严重违章，红色危险等级）**\n- **违反条款**：《电力安全工作规程（热力和机械部分）》第15.1.4条规定："高处作业人员必须牢固配置和穿戴双钩安全带，严禁失去保护在无隔离和安全防护的高空进行作业或违规将两钩安全带悬挂至非承重防护栏杆上。"\n\n#### 👨‍🔧 应急及现场防范措施：\n1. **实时喊话制止**：系统将自动触发锅炉检修区第5号指向性广播进行现场语音警报："请5号脚手架作业人员立即系牢双钩安全带，两票监护人立即制止违章操作！"\n2. **锁定派发罚单**：AI抓拍模块已自动锁定现场违规事件人面部特征，发送通知至点检长，暂扣当日作业证，责令下架进行安规考评再教育。',
      '怎么在管理看板上配置，才可以将AI抓拍和场站广播大喇叭报警实时联动？':
        '配置联动共分三步，且已实现零代码白话编排：\n1. **配置设备绑定**：在"视频管理-摄像头管理"中，将指定摄像头与该区域所属的"场站PA广播中控终端"（如集控3楼大喇叭）映射在同一空间节点。\n2. **规则拖拽组合**：在"智能体应用编排（Orchestration）"中引入此智能体，拉取触发连线：【AI抓拍严重违约】 ➡️ 【触发本地大喇叭系统接口（TTS转音频）】。\n3. **阈值与模板**：设置判定阈值（置信度>85%）才广播。广播台词内置宏定义如：`"检测到{区域名称}有人员{违章动作}，请立即纠正！"`。',
    },
  },
  '两票安全规范合规审查': {
    title: '两票安全规范合规审查',
    desc: '智能对照企业安规及防误逻辑，分析工作票、操作票内潜在风险死角并标记修改建议。',
    category: '安全',
    views: '8645',
    copies: '3012',
    accuracy: '99.1%',
    baseModel: 'Gemini-1.5-Flash',
    systemPrompt:
      '你是最严苛的电网安全工作"两票"（工作票、操作票）合规审核员。请针对用户提交的两票各操作细节，核对防误防抖逻辑，找出缺少封堵安全接地、缺少操作前安全确认、防护具未载明、无监护人等逻辑漏洞，并标注在原栏修改方案中。',
    scenario: '机组检修倒闸操作、一二次换母线、继电保护定值整定工作票拟定前置机审，减低人审漏看风险。',
    icon: FileText,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    presetQuestions: [
      '某110kVSF6断路器自检转检修操作票中，"断开发电机2号出线"后面没有"验明确无电压"直接验电接地，这合理吗？怎么修改？',
      '审核逻辑目前对大体量操作票（比如超过80项继保传动联锁票）会不会发生逻辑漏审？',
    ],
    presetAnswers: {
      '某110kVSF6断路器自检转检修操作票中，"断开发电机2号出线"后面没有"验明确无电压"直接验电接地，这合理吗？怎么修改？':
        '### ⚠️ 两票红牌警告：操作票存在恶性逻辑缺陷！\n\n- **缺陷认定**：不合理。违反了**"电气闭锁两道防线原则"**。\n- **违反安规规程**：《国家电网安全生产红线禁令》第三条："严禁未验电、未核对无电而直接强行闭合接地开关、或悬挂装设临时短路接地线。"\n- **危害分析**：直接接地如果面临由于断路器断开辅助接点失灵、未真正机械隔离的情况，会导致**带电强合接地线恶性短路事故**，瞬间引发弧光爆炸，损毁高压设备并严重危及人身安全！\n\n#### 📝 正确修订方案：\n```markdown\n【步骤 05】 断开发电机2号出线。（检查102断路器在分闸位）\n【步骤 06】 【漏项新增】 验明发电机2号出线三相确无电压。\n【步骤 07】 确认验电良好后，合上发电机2号出线侧接地刀闸（或装设接地线）。\n```',
      '审核逻辑目前对大体量操作票（比如超过80项继保传动联锁票）会不会发生逻辑漏审？':
        '绝对不会。通过我们研发的**"关联防错状态空间网（Finite State Machine Map）"**：\n1. **高维状态流追踪**：对多阶复杂合闸逻辑链，AI不仅仅做文本文字检测，而是在其内部自动建立断路器、接地刀、母联闸等开关的虚拟全息拓扑拓扑状态网。\n2. **逆向动态防误闭锁**：逆推每一操作对场站总阻抗及电弧拓扑的影响，任何逻辑漏洞、前后操作倒序等细微死角在第一关就会被死锁高亮。',
    },
  },
  '安全隐患智能化分析专家': {
    title: '安全隐患智能化分析专家',
    desc: '自动识别巡检照片或现场截图中的人员违章和物理隐患，一键生成整改防护方案及对应的安全规章制度援引。',
    category: '安全',
    views: '16830',
    copies: '4255',
    accuracy: '99.4%',
    baseModel: 'Huaneng-Vision-Safety-v3',
    systemPrompt:
      '你是安全隐患智能化分析专家。用户上传作业照片或设备截图后，请对图像进行深度视觉判定，定位不安全状态或违章行为，给出定性研判、应急处置整改步骤，并精准列出相关的安全生产红线禁令与规章制度。数据采用高度结构化的格式汇报。',
    scenario: '适用于作业现场日常巡检图片合规自查、检修工单执行照片机审核验、重大隐患辨识培训。',
    icon: ShieldAlert,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    presetQuestions: [
      '请对作业现场常见的高处作业不规范情况进行诊断说明。',
      '如果上传了配电房接地电阻测试或防鼠隔板松动的图片，会怎么分析？',
    ],
    presetAnswers: {
      '请对作业现场常见的高处作业不规范情况进行诊断说明。':
        '### 🚧 典型巡检场景：高处作业不规范隐患诊断范例\n\n- **隐患认定**：高处作业防坠落保护缺失 / 作业平台护栏未闭合\n- **危害分析**：高处坠落事故是电力生产中发生率极高的严重人身伤亡事故。任何高处（2米及以上）作业若未系挂防双钩安全带或安全网缺失，都会直接构成特大安全隐患。\n\n#### 👨‍🔧 处置建议与整改手段：\n1. **立即停工撤人**：现场安监员或远程巡检人员发现后，必须立即通过"一键停工"下达违章停工指令。\n2. **补装并闭合侧护栏**：对于临时升降平台上未闭合或缺失中间护栏的部位，责令配合使用硬质隔档防机械滑移。\n3. **挂牌考核限期反馈**：限发"2小时内整改单"，要求作业班组在系好防坠双安全绳并修复完好护栏后，再次拍照上传本智能体复核审结。\n\n- **引用国家/行业规章制度条文**：\n  1. **《电力安全工作规程（热力和机械部分）》** 第15.1.3条：在没有脚手架或者在没有栏杆的脚手架上工作，高度超过1.5m时，必须使用安全带，或采取其他可靠的安全防护措施。\n  2. **《中华人民共和国安全生产法》** 第四十四条：生产经营单位应当在有较大危险因素的生产经营场所和有关设施、设备上，设置明显的安全警示标志。',
      '如果上传了配电房接地电阻测试或防鼠隔板松动的图片，会怎么分析？':
        '对于配电房等配电重要区域：\n\n1. **防鼠挡板失效判定**：配电房门口阻隔防鼠隔板（通常高度不低于50cm）如果缺失、倾斜或变形，会导致小动物或鼠类意外爬入，触碰带电母线绝缘端导致恶性短路或引起机组跳闸保护。\n2. **规范规定引用**：\n   - **《国家电网有限公司电力安全工作规程（变电部分）》** 明确要求高压配电房及控制室必须配备牢固的防鼠隔栅挡板（挡鼠板）。\n3. **整改举措**：立即要求运行班组恢复标准不锈钢/塑料硬隔板挂设，并在交接班日志中做好夜间防护巡检记录。',
    },
  },
  '发电机组深度寻优建议': {
    title: '发电机组深度寻优建议',
    desc: '动态捕获真空度、排烟温升及机组振动测点指标，通过能效标杆数据库得出降耗空间。',
    category: '运行',
    views: '19280',
    copies: '8930',
    accuracy: '97.9%',
    baseModel: 'Huaneng-Thermodynamics-v2',
    systemPrompt:
      '你是专注于大型火电机组、燃机及超临界参数寻优的集控运行总工专家。要求你对任何测点偏移（锅炉效率降、排烟热损失增加、汽轮机真空偏移）进行理化公式演绎，找出根本原因并提出降煤耗运行调整建议。',
    scenario: '集控实时运行状态寻优、标煤煤耗优化。用于指导运行值班员细化吹灰频率、调校最佳送风比。',
    icon: Gauge,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    presetQuestions: [
      '当前2号发电机负荷 950MW，锅炉排烟温度突发升至142℃，煤耗指标预计微涨。应如何调整运行参数实现寻优？',
    ],
    presetAnswers: {
      '当前2号发电机负荷 950MW，锅炉排烟温度突发升至142℃，煤耗指标预计微涨。应如何调整运行参数实现寻优？':
        '### 📈 发电机运行热动效率偏离寻优诊断书\n\n- **异常定性**：排烟温度142℃偏离额定工况设计值（132℃），热传导受阻。\n- **煤耗损失估算**：通常排烟温度每升高10℃，锅炉效率下降大约0.5%-0.6%，**等效增加发电标煤耗约 1.5-1.8g/kWh**。\n\n#### ⚙️ 动态运行参数寻优干预操作：\n1. **按区域定点对空气预热器进行加强吹灰**：可能由于两电极空预器换热面积结灰严重，换热效能退化。建议下达吹灰指令：执行空预器全面吹灰程序，监控排烟温度是否回调。\n2. **控制和调降二次风配风比**：若炉膛二次风量过大、氧量持续处于过饱和（如烟气含氧 > 4.5%），会引起炉内对流换热滞后，火焰中心上移导致过热排烟飙高。请将过剩空气系数调减至1.15-1.2区间。\n3. **监控磨煤机进口一次风温**：调配混配煤，提升一次风风压，拉低烟气冲刷速度。',
    },
  },
  '油浸式变压器缺陷根因溯源': {
    title: '油浸式变压器缺陷根因溯源',
    desc: '分析油中溶解气体谱图，研判变压器局部过热、电弧放电等内部早期异常缺陷位置。',
    category: '检修',
    views: '13950',
    copies: '5932',
    accuracy: '98.5%',
    baseModel: 'Qwen-Specialized-DGA-7B',
    systemPrompt:
      '你是资深的电厂主变压器、高抗检修专家，极度熟悉变压器油色谱分析（DGA）、三比值法、杜瓦三角形、大卫三角形及气体理化变动。请严谨依据GB/T 7252-2001，对用户报出的气体组分数值进行缺陷类型鉴定及事故溯源定位。',
    scenario: '主变色谱数据突变异常时的诊断支持，判别变压器局部高温过热、大电流放电或进水受潮缺陷。',
    icon: Wrench,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    presetQuestions: [
      '变压器油样色谱显示：甲烷145ppm，乙烯380ppm，乙烷60ppm，乙炔2ppm，氢气85ppm。使用三比值法怎么研判？',
    ],
    presetAnswers: {
      '变压器油样色谱显示：甲烷145ppm，乙烯380ppm，乙烷60ppm，乙炔2ppm，氢气85ppm。使用三比值法怎么研判？':
        '### 🩺 变压器 DGA 故障色谱速筛报告\n\n- **气体主要特征**：乙烯（C2H4）突发高达380ppm并伴随高浓度甲烷（CH4），乙炔微量不设红线警告。\n- **三比值特征代码提取**：\n  - 比值1：C2H2/C2H4 = 2/380 ≈ 0.005 → 状态码：**0**\n  - 比值2：CH4/H2 = 145/85 ≈ 1.7 → 状态码：**2**\n  - 比值3：C2H4/C2H6 = 380/60 ≈ 6.33 → 状态码：**2**\n- **比值组合状态码**：**[0, 2, 2]**\n- **诊断故障类型**：**高温热故障 (>700℃) - 严重局部高温过热缺陷**\n\n#### 📍 缺陷根源及故障物理定位：\n1. **故障源筛查：铁芯绝缘件或分接开关触点**。极大概率变压器因铁芯局部多点接地，导致环流温升急剧超负荷；或分接开关切换片弹簧松动，在高电位负载切换中形成过载接触电阻局部发红。\n2. **由于CO超标较多**，说明局部高温已灼伤木质隔板或绝缘漆纸介质固体材料。建议尽快安排气孔漏点密封度试验、停电紧固二次分接片。',
    },
  },
  'ChatPDF 企业知识库问答': {
    title: 'ChatPDF 企业知识库问答',
    desc: '上传 PDF 文档后可用自然语言对话，毫秒级追溯企业技术规程及运营方案细则。',
    category: '办公',
    views: '8570',
    copies: '8868',
    accuracy: '99.5%',
    baseModel: 'Gemini-1.5-Pro',
    systemPrompt:
      '你是具备超强视觉分析与深度语义检索的 ChatPDF 智能体。用户上传文件后，你将基于该PDF的向量索引提供精准、附带原文页码印证的回答，不胡编乱造，支持精准定位表格及图表段落。',
    scenario: '针对大型工程蓝图、锅炉设计说明书、安全防护国家标准的点对点智能快检与细节追踪。',
    icon: FileText,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    presetQuestions: [
      '上传了《某集控变频器技术手册.pdf》，帮我总结变频器突发5号过电压告警的排查步骤。',
    ],
    presetAnswers: {
      '上传了《某集控变频器技术手册.pdf》，帮我总结变频器突发5号过电压告警的排查步骤。':
        '根据《某集控变频器技术手册.pdf》第214页"故障排查分册（4.2节：5号高过压警告）"：\n\n### ⚡ 5号直流母线过电压故障排查导引\n\n1. **瞬态阻抗监测**（页码：214-4项）：\n   - 首先使用数字万用表测试母线接点的瞬态阻抗，检查三相供电电压波动是否超出标准上限。手册额定限值为Un + 15%（即主变侧输入需控制在额定电压的115%以内）。\n2. **放电电阻和斩波器探点**（页码：215-1项）：\n   - 检查变频器顶部的制动斩波部分。用红外热像仪观察制动电阻连接线缆温度，若温度与室温相同，则制动斩波器或触发晶闸管损坏，无法闭合同轴制动。\n3. **减速回馈参数配置校算**（页码：216-2项）：\n   - 如果此警报在机组快速离网上降负荷时频发，请检查第65号调试寄存器参数，将减速积分常数由默认的12秒提升至18秒，放缓机械能回灌电能频次。',
    },
  },
};

// ====== 组件 ======

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  logs?: string[];
}

export function AgentChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedTitle = searchParams.get('title');
  const resolvedTitle = requestedTitle || '基础法律问答助手';
  const agentFound = requestedTitle ? requestedTitle in agentsData : true;
  const activeAgent = agentsData[resolvedTitle] || Object.values(agentsData)[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingLogs, setTypingLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始欢迎消息
  useEffect(() => {
    if (activeAgent) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          text: `您好！我是 **${activeAgent.title}** 精英智能体。\n\n我基于 ${activeAgent.baseModel} 工业特调底座。我会协助运行、检修及日常办公合规工作：\n- *系统配置定位*：${activeAgent.scenario}\n- *已配安全策略*：${activeAgent.systemPrompt.slice(0, 50)}...\n\n您可以点击下方的"预设快捷问题"直接体验，或者也可以在下方输入框中描述您的具体问题进行诊断！`,
        },
      ]);
    }
  }, [resolvedTitle]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 模拟推理过程
  const simulateThinking = (question: string) => {
    setIsTyping(true);
    setTypingLogs([]);

    const thinkingSteps = [
      `🔍 调阅本地知识库，提取 "${question.substring(0, 10)}..." 关联特征向量...`,
      `⚙️ 加载特调底座模型 ${activeAgent.baseModel} 进行逆向推理校验...`,
      `📐 关联安规《电力安全规程》并进行边界条件对齐...`,
      `✍️ 整合行业特异参数，正格式化输出专业修复方案...`,
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < thinkingSteps.length) {
        setTypingLogs((prev) => [...prev, thinkingSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);

        const finalAnswer =
          activeAgent.presetAnswers[question] ||
          `我已经接收到了您的专业问询："${question}"。\n\n基于我的工业领域大模型推理，为您提供如下精益分析：\n1. **设备与流程定位**：针对该特种情况，建议在机组断电前置对齐工况，启动多维度全数字孪生核算；\n2. **合规防御建议**：必须严格遵循行业技术标准进行检修备档，对于可能存在的电气与理化异常进行即时在线闭环；\n3. **二次核查指引**：如有必要，上传实时测点时序数据 CSV，我将为您深度绘出趋势变化图卷。`;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: finalAnswer,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            logs: [...thinkingSteps],
          },
        ]);
        setIsTyping(false);
        setTypingLogs([]);
      }
    }, 1300);
  };

  const sendMessage = (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (textToSend === undefined) setInputText('');

    setTimeout(() => {
      simulateThinking(text);
    }, 400);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-6 h-full pb-6">
        {/* ====== 左侧：智能体档案面板 ====== */}
        <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
          <Card className="border-line bg-surface overflow-hidden p-0">
            <CardContent className="relative space-y-4 p-6">
              {/* 背景光晕 */}
              <div className="absolute top-[-20%] right-[-10%] w-36 h-36 bg-primary/10 rounded-full blur-3xl z-0" />

              {/* 返回按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agents/AgentPlaza')}
                className="text-fg-muted hover:text-fg relative z-10 -ml-2"
              >
                <ChevronLeft size={16} className="mr-1.5" />
                返回智能体广场
              </Button>

              {/* 未找到智能体时的提示 */}
              {!agentFound && (
                <div className="relative z-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-fg-muted">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">⚠️ 未找到智能体「{requestedTitle}」</span>
                  <span className="block mt-1">已为你切换到默认智能体，你可以返回广场重新选择。</span>
                </div>
              )}

              {/* 图标 + 标题 */}
              <div className="flex items-start gap-4 relative z-10">
                <div
                  className={cn(
                    'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-line/40',
                    activeAgent.iconBg,
                  )}
                >
                  <activeAgent.icon className={cn('w-7 h-7', activeAgent.iconColor)} />
                </div>
                <div className="space-y-1.5">
                  <Badge variant="secondary" className="text-[10px] font-bold tracking-widest uppercase">
                    {activeAgent.category}类智能体
                  </Badge>
                  <h2 className="text-xl font-bold text-fg leading-tight">{activeAgent.title}</h2>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-xs text-fg-muted leading-relaxed bg-muted/30 p-3 rounded-xl border border-dashed border-line/40">
                {activeAgent.desc}
              </p>

              {/* 配置信息 */}
              <div className="border-t border-line pt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-fg-muted">底座模型大类</span>
                  <span className="font-mono font-bold text-fg bg-muted px-2 py-0.5 rounded-md border border-line/50">
                    {activeAgent.baseModel}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-fg-muted">精准度 / 置信率</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    {activeAgent.accuracy}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-fg-muted">环境配置状况</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-md font-mono text-[10px]">
                    <Activity size={12} className="animate-pulse" />
                    ACTIVE ON CONTAINER
                  </span>
                </div>
              </div>

              {/* 统计 */}
              <div className="border-t border-line pt-4 flex gap-6 text-[11px] text-fg-muted font-mono">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} />
                  {activeAgent.views} 浏览
                </span>
                <span className="flex items-center gap-1.5">
                  <Download size={12} />
                  {activeAgent.copies} 引用
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ====== 预设快捷问题 ====== */}
          <Card className="border-line bg-surface flex-1 p-0" >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={15} className="text-primary" />
                <h3 className="text-xs font-bold text-fg uppercase tracking-wider">预设快捷诊断指令</h3>
              </div>
              <div className="space-y-2.5">
                {activeAgent.presetQuestions?.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => sendMessage(question)}
                    className="w-full justify-between text-left h-auto py-2.5 px-3 text-xs font-medium group"
                  >
                    <span className="truncate flex-1 pr-2">{question}</span>
                    <ArrowRight
                      size={12}
                      className="opacity-0 group-hover:opacity-100 text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== 右侧：对话工作台 ====== */}
        <Card className="flex-1 border-line bg-surface flex flex-col overflow-hidden min-h-0 p-0">
          {/* 顶部状态栏 */}
          <div className="bg-muted/30 px-6 py-3.5 border-b border-line flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-fg-muted font-bold tracking-wider uppercase leading-none">
                  AGENT SESSION RUNNING
                </span>
                <span className="text-xs text-fg mt-1">Prompt 规则约束生效中...</span>
              </div>
            </div>

            {/* System Prompt 悬浮提示 */}
            <div className="relative group max-w-sm hidden md:block">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg cursor-help">
                <Settings size={13} />
                <span>查看 System Prompt 规则</span>
              </div>
              <div className="absolute right-0 bottom-8 w-80 p-4 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl opacity-0 scale-95 origin-bottom-right group-hover:opacity-100 group-hover:scale-100 transition-all z-40 pointer-events-none space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-indigo-300 font-bold">
                  <Terminal size={12} />
                  <span>SYSTEM REGISTRATION PROMPT</span>
                </div>
                <p className="text-[11px] leading-relaxed select-text text-slate-300">
                  "{activeAgent.systemPrompt}"
                </p>
              </div>
            </div>
          </div>

          {/* 对话区域 */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-3.5', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
              >
                {/* Bot Avatar */}
                {msg.sender === 'bot' && (
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center border border-line shadow-sm shrink-0',
                      activeAgent.iconBg,
                    )}
                  >
                    <activeAgent.icon className={cn('w-5 h-5', activeAgent.iconColor)} />
                  </div>
                )}

                <div className={cn('space-y-1 max-w-[85%] lg:max-w-[70%]')}>
                  <div className="flex items-center gap-2 text-[10px] text-fg-muted font-mono px-1">
                    <span>{msg.sender === 'user' ? 'ME (运行负责人)' : `${activeAgent.title} (智脑)`}</span>
                    <span>·</span>
                    <span>{msg.time}</span>
                  </div>

                  <div
                    className={cn(
                      'rounded-2xl p-4 text-xs leading-relaxed shadow-sm whitespace-pre-line',
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 text-fg border border-line/50',
                    )}
                  >
                    <span
                      className={cn(
                        'whitespace-pre-line text-xs leading-relaxed',
                        msg.sender === 'user' ? 'text-primary-foreground' : 'text-fg',
                      )}
                    >
                      {msg.text}
                    </span>
                  </div>

                  {/* 推理日志 */}
                  {msg.logs && msg.logs.length > 0 && (
                    <details className="mt-2.5 border border-line bg-muted/20 rounded-xl px-3.5 py-2.5">
                      <summary className="cursor-pointer text-[10.5px] font-bold text-fg-muted hover:text-primary outline-none select-none flex items-center gap-2">
                        <Terminal size={12} className="text-primary" />
                        <span>查看大模型推理执行日志 ({msg.logs.length} 条记录)</span>
                      </summary>
                      <div className="mt-2 gap-2 space-y-1.5 border-t border-line pt-2 font-mono text-[9.5px] text-fg-muted">
                        {msg.logs.map((log, lidx) => (
                          <div key={lidx} className="flex gap-1.5 items-center">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                            <span className="truncate">{log}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}

            {/* 加载动画 */}
            {isTyping && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted border border-line shrink-0">
                  <Bot size={18} className="text-primary animate-bounce" />
                </div>
                <div className="space-y-2 mt-1 flex-1 max-w-[80%]">
                  <div className="text-[10px] text-fg-muted font-mono">
                    <span>{activeAgent.title} 正在进行高强度推理寻优...</span>
                  </div>
                  <div className="bg-muted/30 p-4 border border-line rounded-2xl flex flex-col gap-2 relative">
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-primary animate-pulse rounded-t-2xl" />
                    <div className="space-y-1.5 font-mono text-[10.5px] text-fg-muted">
                      {typingLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check size={12} className="text-emerald-500" />
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                      <span className="text-[9.5px] text-fg-muted font-mono animate-pulse">
                        正在生成最终结构化答复文本...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ====== 底部输入区 ====== */}
          <div className="p-4 border-t border-line bg-muted/10 shrink-0">
            <div
              className={cn(
                'flex items-center gap-2 rounded-2xl bg-surface border border-line px-4 py-2.5 transition-all',
                'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10',
              )}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`向 ${activeAgent.title} 发起提问...`}
                className="flex-1 bg-transparent border-none text-xs text-fg outline-none py-1.5 focus:ring-0 placeholder-fg-muted"
              />
              <Button
                size="icon-sm"
                onClick={() => sendMessage()}
                disabled={!inputText.trim()}
                className="shrink-0"
              >
                <Send size={15} />
              </Button>
            </div>
            <div className="flex items-center justify-between text-[10.5px] mt-2.5 px-1.5 text-fg-muted">
              <span className="flex items-center gap-1">
                <AlertCircle size={11} />
                <span>支持描述专业问题，AI 将进行深度诊断分析</span>
              </span>
              <span className="font-mono">按 Enter 键极速发送</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
