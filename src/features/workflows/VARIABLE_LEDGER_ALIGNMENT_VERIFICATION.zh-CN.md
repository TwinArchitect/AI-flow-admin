# 变量台账迁移与验收

日期：2026-10-30。参照本地 `agent-open-cloud-protal` 的 `workflowVariableLedger.ts`、`VariableLedgerPanel.tsx`、WorkflowEditor 与编排工具栏，未 fetch/pull。

## 补齐范围

此前本项目只有变量选择器和输出索引，没有独立变量台账面板。历史工作流插件记录中“接入变量台账”应理解为已接入可用变量索引；独立面板在本轮补齐。

- 工具栏“变量台账”开关与关闭按钮；画布下方保留面板空间，不覆盖画布，节点配置/调试侧栏继续使用原有布局。
- 汇总全部全局变量与节点输出，使用本项目 Start 规范化与节点 registry 输出契约。开始节点自定义全局变量去重，固定用户问题保留；同名节点追加短 ID。
- 引用路径、来源、变量标签/键、声明类型、运行类型、默认值/内容摘要、未调试/本轮未执行/已采样状态与类型不一致标识。
- 搜索变量名、键、节点、引用和类型；全局/节点分组，采样/不一致筛选；总数、采样数、不一致数统计。
- 只读详情：JSON/基本值、文件字段说明、运行时结构示例；无样本时可查看文件结构，明确标注非本轮采样；节点定位并打开现有配置面板。
- 关闭后保留搜索、筛选和选择状态；切换工作流后重置台账局部状态。
- 使用本项目 Button、Input、Select、Badge 与语义 token，无参照项目的弹窗/下拉和私有滚动条样式。

聚合逻辑以参照为基础适配节点结构；保留 null 真实样本，支持本项目额外的 arrayNumber/arrayBoolean/arrayObject/arrayAny/any/dynamic 类型，避免误报。文件默认/采样按 FileInfo[] 展示，保留 url/name/mime/type。

## 验证

- 首轮及最终补丁后 `pnpm type-check` 均通过。
- `node --test src/features/workflows/utils/workflowVariableLedger.test.cjs` 五项通过：默认值/全局去重/文件结构、开始事件回退与运行字段、null 保留、0/false/未执行状态/重名、结构化 JSON 与类型不一致。该测试隔离 registry，输出契约由适配桩提供，不冒充真实后端运行。
- Chrome：专用工作流 `1275607123908222976` 展示 8 项；文件字段说明与完整示例、搜索、节点定位、关闭重开保留搜索、全局筛选均通过。
- 真实调试输入“变量台账真实采样1030”，不调用模型：5 项已采样，开始输入与结束 echo 正确；marker 显示 `WORKFLOW_PLUGIN_OK_1029`，tag/fileEcho 为 null，类型不一致统计 2；对应筛选仅显示这两项。
- 截图 `/private/tmp/variable-ledger-acceptance-1030.png`。

## 验收边界

当前 UI 与一次真实运行闭环通过；文件运行时补全和类型边界由聚合测试覆盖，未新增真实附件上传或遍历所有节点类型的运行。台账不修改工作流配置、不新增后端接口。
