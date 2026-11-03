# 代码执行节点对齐验收

日期：2026-10-27。参照：本地 `agent-open-cloud-protal` 当前代码。

## 已补齐

- JavaScript/Python、默认模板与自定义脚本切换行为。
- 保存、加载和 AI 回填保留源码换行与注释；Python 字符串转义不做 JS 式还原。
- 兼容 py/python/python3；无输入配置时从 main 参数或 arg0 等推断入参。
- 兼容 dynamic/static/未标类型的历史输出，排除 out_value。
- 输出字段名与相对 JSONPath、类型双向转换。
- AI 上下文包含 arg 序号、变量名、类型及输出提示。
- Python 包与使用限制说明，JS 两个示例、Python 三个示例。
- 语法高亮、粘贴清理、放大编辑及放大窗口内 AI 优化。
- Select、Dialog、Button、Textarea 使用本项目组件库。

## 浏览器与真实后端结果

测试工作流：解浩测试，ID 1270178020065976320。

| 项目 | 结果 |
| --- | --- |
| Python 说明与三个示例、数值求和回填 | 通过 |
| 放大编辑、窗口内 AI 入口 | 通过 |
| 保存后刷新、参照页面读取同一配置 | 通过 |
| 两个 JS 节点顺序执行、上游对象引用 | 通过；total 从 5 变为 7，换行字符串与数组保留 |
| 输出提取 sum=total，number 类型 | 通过；真实执行 HTTP 200，输出 sum:7；参照恢复字段名/路径/类型一致 |
| 参照项目运行同一 JS 配置 | 四个节点运行成功 |
| Python 真实执行 | 未通过；后端返回“代码执行失败: Python 沙箱连接失败或执行超时” |
| AI 成功生成/回填 | 未通过；两边均返回“系统异常，请与管理员联系！” |
| 异常分支完整运行 | 本次未做浏览器端到端验收；异常标记通过配置往返测试 |

证据截图：`/private/tmp/code-node-js-pass.png`、`/private/tmp/code-node-jsonpath-pass.png`。

自动化回归：`node --test src/features/workflows/contracts/codeNodeContract.test.cjs`，4 项通过。覆盖源码保留、输入输出/异常标记往返、历史兼容、粘贴清理与高亮转义。

验收结束后已保存恢复两个原始脚本、第一节点 Python 语言，移除临时 sum 输出；刷新后逐字核对脚本恢复成功。未发布。

结论：已核对并补齐上述前端功能；JS 与输出提取链路已实测通过。Python、AI 成功路径仍受当前后端报错阻塞，不能宣称全部端到端通过。
