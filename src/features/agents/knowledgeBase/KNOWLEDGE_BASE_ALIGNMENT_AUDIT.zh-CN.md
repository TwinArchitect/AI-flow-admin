# 知识库整页对照审查（2026-11-02）

> 当前状态（2026-11-03）：早期整体缺口与共同阻断保留作证据；当前剩余项已重新归类。 统一待办与是否切换任务以 [收尾状态表](./CLOSEOUT_STATUS.zh-CN.md) 为准。

## 基线和结论

2026-11-03 二次代码审查发现的 4 组边界差异（图片格式、旧策略规范化、元素标签限制和快捷交互）已补齐，类型检查及 15 项针对性测试通过，详见 [二次审查](./SECOND_PASS_REVIEW.zh-CN.md)。真实媒体样本回归仍待进行，不将静态覆盖等同运行验收。

执行顺序（用户最新要求）：先补齐功能并完成静态对照收尾，再测试实际效果，最后统一美化 UI。接口未调用不自动算页面遗漏，后端实际失败也不自动算迁移缺口。2026-11-02 收尾补上复制降级和文档接口一览；已确认专用 PDF 预览、单分块获取在参照知识库页未使用。当前真实效果待验项继续保留，不宣称全部验收完成。

参照本地 agent-open-cloud-protal，知识库相关最新提交 1d23748b（2026-10-26），上一轮大规模更新 8171d84d（2026-09-29）。仅审查当前本地代码，没有拉取远程。

知识库主体基础链路已接入，但整页没有完全覆盖当前参照。此前配置页验收不能代表文件、预览、富化、评测、导入导出全部完成。本次是静态代码对照，不将存在接口或按钮当作运行验收通过。

## 已覆盖及部分覆盖

| 功能 | 当前情况 |
| --- | --- |
| 列表搜索、分页、创建编辑删除、详情统计 | 已有真实 API；新建继承默认 Embedding、编辑保留高级配置刚补齐，创建后补读详情并进入详情已实现但最新改动未重新运行验收 |
| 详情配置 | 基础信息、Embedding、解析器、分块、签字、标签/摘要配置及分区已补；保存回显已有实测记录 |
| 租户模型配置 | 七种用途绑定、清除、失效回显、MinerU 检测入口已补；真实 MinerU 无 Parser 服务未测 |
| 文档基础管理 | 上传、进度、停止、检索开关、下载、单个/批量删除已接入；不能据此认定重解析策略一致 |
| 分块基础管理 | 查询分页、内容增改删、检索启停、图片基础展示已接入；标签与联动预览未完整迁移 |
| 原文基础预览 | PDF、DOCX、Excel、文本/Markdown、图片已有；缺少参照的复合预览能力 |
| 检索基础参数 | 阈值、混合检索、融合权重、Rerank、Top K、数量及结果展示已有；缺少 trace、评测等 |

## 确认缺口

第六轮进展：KB-A09 服务 API、密钥管理、完整接口文档及权限已接入；9 项接口模拟/权限测试和类型检查通过。两项目真实密钥空列表一致，本项目创建表单取消、文档内管理入口通过。真实凭证生命周期及开放 API 调用未验收，见 [第六轮记录](./SERVICE_API_ALIGNMENT.zh-CN.md)。下表为初次审查时的差异，不代表当前仍未实现。

进展（2026-11-02）：KB-A01、KB-A02 已完成第一轮实现及可执行读写测试，详见 [文档富化验收](./DOCUMENT_ENRICHMENT_ALIGNMENT.zh-CN.md)。下表保留最初差异证据；真实生成仍受共同后端异常阻断，不表示全部运行验收通过。

第二轮进展：KB-A03、KB-A04 已补分块标签读写/筛选及增量、强制重解析逻辑，详见 [第二轮验收](./CHUNK_REPARSE_ALIGNMENT.zh-CN.md)。分块真实写入/筛选/刷新通过，8 项自动测试及类型检查通过；真实重解析任务至完成待环境补验。

第三轮进展：KB-A05 复合预览代码已接入，文本与分块并排、放大及 Markdown 已实测；14 项自动测试通过。解析元素异常已在参照同文件复现。完整边界及待补验项目见 [预览验收记录](./PREVIEW_ALIGNMENT.zh-CN.md)。

第四轮进展：KB-A06、KB-A07 已接入检索诊断和评测，真实检索两项目同题同分块命中，四路分数与诊断一致；3 项自动测试及类型检查通过。保存/运行评测均在参照复现系统异常，待补验。详见 [第四轮记录](./RETRIEVAL_EVALUATION_ALIGNMENT.zh-CN.md)。

第五轮进展：KB-A08 内容包导入导出已迁移，5 项自动测试和类型检查通过；未完成解析文件导出拦截、缺 manifest 包校验均在两项目同数据实测一致。合法包成功导出/导入/向量任务闭环仍待补验，见 [第五轮记录](./ARCHIVE_TRANSFER_ALIGNMENT.zh-CN.md)。

| 编号 | 领域 | 参照业务 | 本项目差异和证据 | 建议顺序 |
| --- | --- | --- | --- | --- |
| KB-A01 | 文档内容富化 | 文档知识标签/摘要查看、人工编辑、重新生成、恢复 AI；来源及状态反馈 | 本项目只有生成配置开关，没有 KbDocumentEnrichmentDialog 对应业务；documentApi 没有 enrichment 获取/更新/regenerate/restore-ai 接口 | 1 |
| KB-A02 | 文件标签过滤 | 文档知识标签选项、按标签查询文档列表 | 本项目 queryDocuments 仅 keyword/page/size；缺少参照 enrichment/page 和 enrichment/tags 接入及筛选 UI | 1 |
| KB-A03 | 分块标签 | 新增/编辑 tags，按标签筛选、文档标签选项 | ChunksModal 编辑只提交 content，新增未带 tags；缺少 tags/document 请求及标签过滤 UI | 2 |
| KB-A04 | 重解析语义 | 已完成文件支持增量重解析，未变化提示跳过；强制重解析单独确认；单个与批量一致 | 当前重新解析直接 force=true；skipped 分支未清 pending 且仍提示启动成功；按 taskIds 判断可能误报旧版本成功响应。需按参照逐状态核对，未做运行复现 | 2 |
| KB-A05 | 复合预览 | 原文/结构化元素与分块联动，图片列表、元素内容、分页定位，媒体标签维护 | 本项目 DocPreviewModal 与 ChunksModal 分离；没有 listDocumentElements/listDocumentImages、媒体标签更新及相应面板 | 3 |
| KB-A06 | 检索诊断 | trace=true，展示召回/过滤/重排过程信息，归一化结果 | 本项目检索未发送 trace，也没有 trace 状态/面板；使用 chunks 原值，缺少参照 normalizeRetrievalChunk 的兼容处理 | 4 |
| KB-A07 | 检索评测 | 命中保存为评测用例，运行评测集，展示 Hit@K/MRR | 本项目没有 retrievalEvaluationApi、用例保存/运行入口；参照 API 另有列表/删除封装，不能把未挂 UI 的 API 也算页面必迁项 | 4 |
| KB-A08 | 知识库导入导出 | 导出内容包、可带原始文件；导入预览、模型维度校验、确认导入及生成向量 | 本项目 datasetApi 只有 CRUD/stats，无 archive preview/import/export 或 KbTransferDialog 对应入口；与智能体 DSL 导入导出不同业务 | 5 |
| KB-A09 | 服务 API | 接口说明，知识库 API Key 创建/列表/启停/删除及创建结果展示 | 本项目知识库列表无“服务 API”入口，无 kbApiKeyApi 及对应对话框/文档面板；属于独立新增能力 | 6 |

## 原有范围排除项，不直接记为漏迁移

旧 KNOWLEDGE_BASE_MIGRATION_PLAN 明确排除分类树增删改。参照当前有 KNOWLEDGE 分类发现、展开选中、按 treeId 筛选及目录维护；本项目列表没有分类树、查询不传 treeId。需区分“此前明确未迁移”与“实现遗漏”，重新确认是否纳入当前完整覆盖范围。

详情侧栏折叠、创建人展示名等交互/展示差异优先级低于以上业务缺口。本项目已有检索开关、统一布局、分页与原文预览增强，不应为照搬参照外壳而删除。

## 已知共同问题和验收限制

最新实际效果以 [收尾复验记录](./FINAL_RUNTIME_ACCEPTANCE.zh-CN.md) 为准：同文件解析仍缺 asset_type；同题检索两边当前均 0 候选，实际分块查询均为 0；评测及解析元素仍共同系统异常。早期命中 1 条仅为历史证据，不能替代本轮验收。

- 同一验收库在两项目清空简介保存、整页刷新均回显旧简介，已实测属于共同问题，根因未定位。
- 详情“相似度阈值”在参照也仅为页面状态，未参与保存；不能当作本项目独有缺口。
- Parser 模型为空，真实 MinerU 检测及官网任务未验收。
- 自动标签 LLM 已绑定；真实文本解析与自动标签/摘要生成尚未运行，不能归类环境不支持。
- 合成验收库“验收-知识库配置1102”保留，0 文档；合成文本 /private/tmp/kb-acceptance-1102.txt 已准备，未上传。

## 主要代码证据

- 参照：src/views/KnowledgeBase.tsx；src/features/kb/api/{documentApi,chunkApi,datasetApi,retrievalEvaluationApi,kbApiKeyApi}.ts；components/KbDocumentEnrichmentDialog.tsx、KbTransferDialog.tsx、preview/KbDocumentPreviewDialog.tsx。
- 本项目：KnowledgeBasePage.tsx；api/{documentApi,chunkApi,datasetApi,retrievalApi,mediaApi}.ts；components/{ChunksModal,DocPreviewModal}.tsx。

## 后续验收原则

逐领域迁移并验收，不以配置开关代替结果管理。发现问题后用相同数据、配置和动作复测参照，区分共同问题、本项目差异和未确认情况；使用本项目组件及 token。先迁移可实施逻辑，再集中列出确实缺模型或服务的协助事项。
