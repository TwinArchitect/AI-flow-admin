# iframe 嵌入接入

更新日期：2026-10-29。参照 agent-open-cloud-protal 的宿主启动器、EmbedAssistant、embedAuth、FloatingAiAssistant。

嵌入入口独立于 MainLayout 和后台菜单：`/embed/assistant`。
内部复用 AgentOverviewPage 和既有 conversation-runtime，无独立流解析逻辑。

## 参数

- `token` / `access_token`：必填，业务用户登录 Token，不是开放 API Key。
- `tenantId` / `tenant_id`：可选，租户 ID。
- `appId` / `app_id` / `agentId` / `agent_id`：可选，锁定已发布智能体；省略后允许选择。
- `mode=page`：铺满 iframe；默认 iframe 内直接打开浮动面板并隐藏 FAB。
- `capture=1` / `camera=1`：请求启用移动端拍照；同时要求智能体的文件上传能力开启且允许图片。
- `capturePreview=1`：允许桌面预览拍照入口，仍需满足智能体上传权限。

Token 在助手挂载前写入现有认证 store，所有请求仍由后端验证权限。
与参照项目一样使用本站持久化鉴权存储；同源后台与 iframe 共享该存储。

## 宿主示例

```html
<script data-ai-assistant
  src="http://localhost:3000/assistant-embed.js"
  data-src="http://localhost:3000/embed/assistant?token=YOUR_USER_TOKEN&amp;appId=YOUR_APP_ID&amp;capture=1"
  data-width="420"
  data-height="640"
  data-position="right"
  data-z-index="1000"
  data-open="false"
  defer
></script>
```

发布渠道弹窗仅生成代码，不负责实际显示窗口。`data-open=true` 自动打开，默认只显示悬浮按钮；省略 appId 可选择智能体。

实际运行分工：
- `public/assistant-embed.js` 在业务宿主页面创建按钮和 iframe，管理关闭、重新打开、放大和卸载。
- `EmbedAssistantPage` 接收宿主消息，复用 `FloatingAiAssistant` 和 `AgentOverviewPage` 显示对话。
- `GET /gpt/base/agent/fileUpload/{id}` 提供文件上传能力；前端按类型、大小校验照片，再调用现有上传和对话接口。

宿主与 iframe 使用 `assistant:ready/state/close/toggle-expanded` 消息，双方校验 origin、source 和 instance。关闭保留 iframe，可以重新打开；旧的裸 iframe 关闭协议保留兼容。
启动按钮颜色可由生成代码中的 `data-primary`、`data-primary-foreground`、`data-ring` 传入项目 token 的当前值。

SPA 宿主离开页面时卸载：
```js
const launcher = document.querySelector('script[data-ai-assistant]');
launcher?.dispatchEvent(new Event('assistant:destroy'));
```

## 验证状态

类型检查通过。针对性脚本通过：单/多智能体代码、自动打开和拍照参数、宿主来源校验、上传开关与类型/大小校验、窗口放大、关闭后重新打开、卸载监听器清理。

2026-10-29 Chrome 实测通过：宿主 `http://localhost:3010` 嵌入 `http://localhost:3000`，默认只显示悬浮按钮、点击打开并加载真实对话界面、内部按钮放大/还原、内部关闭、关闭后重新打开、宿主卸载、`data-open=true` 自动打开并加载真实对话界面；普通窗口打开时宿主点击计数可正常递增。临时测试页面和服务已清理。

该实测覆盖本机不同端口的跨源窗口通信，不代表生产域名的 CSP、HTTPS 或浏览器第三方存储策略验收。手机相机调用和照片发送仍待真机端到端实测。
