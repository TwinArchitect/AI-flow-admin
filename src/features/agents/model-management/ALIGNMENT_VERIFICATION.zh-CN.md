# 模型管理功能迁移与实测记录

## 2026-10-27 新版补充验收

本轮对齐参照提交 `1d23748b`，不覆盖下方历史记录的验收边界。

- 默认解析接口已升级为 `/v1/parse/jobs`，保留旧 `/file_parse` 地址识别。两种完整 URL 的拆分和 Base URL 校验均通过定向断言；新建解析配置在浏览器中显示新版路径及 MinerU 协议。
- 卡片区域实际滚动 200px 后，标题位置仍为 105px，分类区保持固定；截图确认底部分页位于卡片滚动区外。
- 真实 Embedding 调试返回 HTTP 200，耗时 613ms；日志显示已发送 dimensions、实际维度 2560、配置维度 2560、校验通过。
- 没有创建或删除模型，没有改动现有模型配置。解析服务当前仍无模型，未执行真实解析服务调用。
- 证据截图：`/private/tmp/models-dimensions-20261027.png`。

日期：2026-10-23。

本项目：`http://localhost:3000/agents/models`；参照：`http://localhost:3001/agent/models`。
对照源码：`agent-open-cloud-protal/src/views/ModelManagement.tsx`、`features/model/{types.ts,utils.ts,api/modelApi.ts}`。

## 已迁移

- 分类统计与点击筛选；列表操作后刷新统计；新增模型沿用当前类别。
- 模型展示名称、模型标识、默认标记及向量维度展示。
- 六类模型配置、按类别切换调用协议和默认路径；MinerU 使用 `/file_parse`。
- Base URL + API Path、旧地址拆分、最终地址预览、地址校验、正整数向量维度校验。
- DashScope、DeepSeek、vLLM、MinerU 协议；保留现有扩展 JSON 参数能力。
- 按用户截图补充 `sendDimensions`，默认开启，读取/保存及状态更新时保留该字段。
- LLM/多模态 SSE 调试、执行日志、内容与推理结果、原始 SSE 和最终响应。
- Embedding 文本、Rerank Query/Documents 编辑、OCR 图片 Base64、解析服务探测输入。
- 调试关闭/页面卸载时中止流；同步响应返回后检查中止状态，避免旧结果覆盖。
- 未启用模型禁用调试；顶部色条按类别着色，未启用置灰。
- 标题与搜索区 sticky；编辑弹窗固定底部操作按钮。

## 浏览器验证

| 项目 | 本项目 | 参照项目 |
| --- | --- | --- |
| 登录和列表 | 成功，8 个模型 | 成功，8 个模型 |
| Embedding 筛选 | 展示 2 个模型 | 展示 2 个模型 |
| 类别切换 | Embedding `/v1/embeddings`、MinerU `/file_parse` | 相同路径 |
| 编辑旧模型 | 自动拆分地址，回显 2560 维 | 相同地址与维度 |
| 保存现有配置 | 弹窗关闭，列表恢复；再次打开正常 | 弹窗关闭，列表恢复 |
| Embedding 调试 | HTTP 200；返回 2560 维，与配置一致 | SUCCESS；返回 2560 维，与配置一致 |
| Qwen3.5-35B-A3B 流式调试 | 连通成功、正文 OK、206 条原始 SSE；最终复测耗时 3137 ms | SUCCESS、正文 OK、原始 SSE 可展开 |
| dimensions 持久化 | 关闭后保存重开为 false；恢复开启后重开为 true | 当前运行页没有此开关 |
| 色条 | 已通过 DOM 计算颜色核对；关闭的 Rerank 为灰色，其余按类别着色 | 未更改参照项目 |
| 顶部固定 | 已确认计算样式为 sticky；滚动键操作失败，实际滚动效果未验收 | 不要求复制参照外观 |

保存测试使用既有 Embedding 模型，未更改模型标识、维度、Token 和启用状态；dimensions 开关测试结束后已恢复开启。

## 验收边界

- 当前运行的参照页不包含用户截图中的 dimensions 开关；本项目依据截图和后端 `sendDimensions` 字段实现，未修改参照项目。
- 删除接口采用当前后端 Controller 明确支持的 POST；未机械复制参照前端 DELETE 调用。
- 未执行真实新增/删除，未切换既有业务模型的启用状态。
- OCR 图片、Rerank、解析及多模态真实调用未完成运行验收；当前解析类别无模型、Rerank 模型关闭。
- 当前数据少于一页，分页切换未实测。
- TypeScript 检查通过，不等同于上述未测场景通过。
