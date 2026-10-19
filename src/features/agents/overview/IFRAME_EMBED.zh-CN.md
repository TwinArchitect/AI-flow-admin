# iframe 嵌入接入

实现日期：2026-10-14。参照 agent-open-cloud-protal 的 EmbedAssistant、embedAuth、FloatingAiAssistant。

嵌入入口独立于 MainLayout 和后台菜单：`/embed/assistant`。
内部复用 AgentOverviewPage 和既有 conversation-runtime，无独立流解析逻辑。

## 参数

- `token` / `access_token`：必填，业务用户登录 Token，不是开放 API Key。
- `tenantId` / `tenant_id`：可选，租户 ID。
- `appId` / `app_id` / `agentId` / `agent_id`：可选，锁定已发布智能体；省略后允许选择。
- `mode=page`：铺满 iframe；默认 iframe 内直接打开浮动面板并隐藏 FAB。
- `capture=1` / `camera=1`：启用移动端拍照；iframe 添加 `allow="camera; microphone"`。
- `capturePreview=1`：允许桌面预览拍照入口。

Token 在助手挂载前写入现有认证 store，所有请求仍由后端验证权限。
与参照项目一样使用本站持久化鉴权存储；同源后台与 iframe 共享该存储。

## 宿主示例

```html
<iframe data-ai-assistant
  src="http://localhost:3000/embed/assistant?token=YOUR_USER_TOKEN&appId=YOUR_APP_ID"
  style="position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:2147483000;background:transparent"
  allow="clipboard-write; camera; microphone"
  title="AI 智能助理"
></iframe>
<script>
const frame = document.querySelector('iframe[data-ai-assistant]');
const assistantOrigin = new URL(frame.src).origin;
window.addEventListener('message', (event) => {
  if (event.origin !== assistantOrigin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'agent-open:assistant-close') frame.remove();
});
</script>
```

关闭按钮发送与参照项目相同的 `agent-open:assistant-close` 消息。
同源可直接移除 frameElement；跨域由上方宿主监听器移除。
宿主同时校验 origin 和 source，避免其他窗口触发移除。

## 验证状态

类型检查已通过。未进行浏览器、跨域或真实拍照实测；需分别验证有/无 Token、单/多智能体、关闭移除和照片发送。
