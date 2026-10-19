const apiAbsoluteUrl = (path: string) => new URL(path, window.location.origin).toString();

/**
 * 智能体发布渠道 — 开放 API 集成文档（与 doc/智能体开放API接口文档.md 对齐）
 */
export function buildOpenApiGuideMarkdown(agentId: string, agentName?: string) {
  const runUrl = apiAbsoluteUrl('/gpt/open/v1/workflows/run');
  const title = agentName?.trim() ? `${agentName.trim()} — 开放 API 集成` : '智能体开放 API 集成';

  return `# ${title}

> **App ID**：\`${agentId}\`  
> **接口**：\`POST /gpt/open/v1/workflows/run\`  
> 同一接口通过请求体 \`stream\` 切换 **SSE 流式** 与 **JSON 阻塞** 两种响应模式。

---

## 1. 响应模式（stream）

| stream | Accept 建议 | 响应 Content-Type | 适用场景 |
|--------|-------------|-------------------|----------|
| \`true\`（**默认**） | \`text/event-stream\` | \`text/event-stream\` | 对话 UI、实时打字机展示 |
| \`false\` | \`application/json\` | \`application/json\` | ERP / 批处理，只需 workflowEnd 汇总结果 |

- **流式**：推送 \`message\` 增量文本 + 节点事件；流程结束时有 \`workflow_finished\` 事件（含 \`data.outputs\`）
- **阻塞**：同步跑完流程，HTTP 响应体为 \`Result<WorkflowRunResponse>\`，直接读 \`data.outputs\`

---

## 2. 鉴权

**流式请求头**：

\`\`\`http
Authorization: Bearer ag-your-full-api-key
X-User-Id: your-end-user-id
Content-Type: application/json
Accept: text/event-stream
\`\`\`

**阻塞请求头**：

\`\`\`http
Authorization: Bearer ag-your-full-api-key
X-User-Id: your-end-user-id
Content-Type: application/json
Accept: application/json
\`\`\`

| Header | 必填 | 说明 |
|--------|------|------|
| Authorization | **是** | \`Bearer \` + 完整 API Key（创建时仅展示一次） |
| X-User-Id | **是** | 第三方业务系统中的终端用户标识，用于监控 UV / 审计 |
| Content-Type | **是** | \`application/json\` |

---

## 3. 请求体

\`\`\`json
{
  "appId": "${agentId}",
  "stream": true,
  "chatGroupId": "session-001",
  "chatId": "optional-chat-id",
  "message": [
    { "role": "user", "content": "你好，请介绍一下产品" }
  ],
  "variables": {
    "客户名称": "张三"
  },
  "files": [
    { "type": "document", "fileId": "file-id-xxx", "content": null }
  ]
}
\`\`\`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appId | string | **是** | 智能体 ID，须与本页 App ID、API Key 绑定一致 |
| stream | boolean | 否 | 是否流式输出；**默认 \`true\`**。\`false\` 时同步返回 workflowEnd 汇总 \`outputs\` |
| message | array | 建议 | 对话消息；\`role\` 默认 \`user\` |
| variables | object | 否 | 流程变量，与画布 \`chatConfig.variables\` 的 key 对应 |
| files | array | 否 | 附件列表；需先上传获取 \`fileId\`（见「附件上传」文档） |
| chatGroupId | string | 否 | 会话分组，用于监控与多轮标识 |
| chatId | string | 否 | 会话 ID（预留） |

---

## 4. 流式响应（stream=true）

- **Content-Type**：\`text/event-stream\`
- 累加 \`message\` 事件中 \`choices[0].delta.content\` 得到完整回复
- 监听 \`workflow_finished\` 获取 \`data.outputs\`（与阻塞模式 \`data.outputs\` 语义一致）

**SSE 事件类型**：

| event | 说明 |
|-------|------|
| \`message\` | AI 回复增量（OpenAI chunk 兼容） |
| \`{flowNodeType}\` | 节点执行完成，如 \`chatNode\`、\`workflowEnd\` |
| \`workflow_finished\` | 工作流结束，含最终 \`data.outputs\` |

---

## 5. 阻塞响应（stream=false）

适用于只需 **结束节点输出变量**、无需实时流式展示的场景。

**成功示例**：

\`\`\`json
{
  "code": 200,
  "message": null,
  "data": {
    "workflow_run_id": "1860000000000000301",
    "workflow_id": "${agentId}",
    "status": "succeeded",
    "outputs": {
      "value_12": "变量 A 的最终值",
      "value_22": "变量 B 的最终值"
    },
    "error": null,
    "elapsed_time": 2.35
  }
}
\`\`\`

| 字段 | 说明 |
|------|------|
| outputs | **workflowEnd（结束）节点**配置的输出变量 |
| status | \`succeeded\` / \`failed\` |
| elapsed_time | 整次运行耗时（秒） |

> 画布须配置 **结束** 节点（\`flowNodeType: workflowEnd\`）并正确引用上游变量，否则 \`outputs\` 可能为空 \`{}\`。

---

## 6. cURL 示例

### 6.1 流式（默认）

\`\`\`bash
curl -N -X POST '${runUrl}' \\
  -H 'Authorization: Bearer ag-your-full-api-key' \\
  -H 'X-User-Id: user-001' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: text/event-stream' \\
  -d '{
    "appId": "${agentId}",
    "stream": true,
    "chatGroupId": "session-001",
    "message": [{ "role": "user", "content": "你好" }]
  }'
\`\`\`

### 6.2 阻塞（取 outputs）

\`\`\`bash
curl -X POST '${runUrl}' \\
  -H 'Authorization: Bearer ag-your-full-api-key' \\
  -H 'X-User-Id: user-001' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{
    "appId": "${agentId}",
    "stream": false,
    "chatGroupId": "session-001",
    "message": [{ "role": "user", "content": "你好" }],
    "variables": {}
  }'
\`\`\`

解析 outputs：

\`\`\`bash
curl -s ... | jq '.data.outputs'
\`\`\`

---

## 7. JavaScript 示例

### 7.1 流式

\`\`\`javascript
async function runAgentStream(apiKey, userId, content) {
  const res = await fetch('${runUrl}', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      'X-User-Id': userId,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    },
    body: JSON.stringify({
      appId: '${agentId}',
      stream: true,
      chatGroupId: \`session-\${Date.now()}\`,
      message: [{ role: 'user', content }]
    })
  });
  if (!res.ok) throw new Error(await res.text());

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  let workflowOutputs = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\\n');
    buffer = lines.pop() || '';
    let eventName = 'message';
    for (const line of lines) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) {
        const data = JSON.parse(line.slice(5).trim());
        if (eventName === 'message') {
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) answer += delta;
        } else if (eventName === 'workflow_finished') {
          workflowOutputs = data.data?.outputs ?? null;
        }
      }
    }
  }
  return { answer, workflowOutputs };
}
\`\`\`

### 7.2 阻塞

\`\`\`javascript
async function runAgentBlocking(apiKey, userId, content) {
  const res = await fetch('${runUrl}', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      'X-User-Id': userId,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      appId: '${agentId}',
      stream: false,
      message: [{ role: 'user', content }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.data; // outputs, workflow_run_id, elapsed_time...
}
\`\`\`

---

## 8. HTTP 错误（鉴权阶段）

| HTTP | 典型原因 |
|------|----------|
| 400 | 缺少 \`X-User-Id\` 或 \`appId\` |
| 401 | API Key 无效 / 已禁用 / 已过期 |
| 403 | 智能体未发布；或 \`appId\` 与 Key 绑定不一致 |

鉴权失败返回 **JSON 错误**（非 SSE）。

---

## 9. 集成检查清单

- [ ] 智能体已发布
- [ ] 已创建并妥善保存 API Key
- [ ] Header 同时携带 \`Authorization\` 与 \`X-User-Id\`
- [ ] Body 中 \`appId\` 为 \`${agentId}\`
- [ ] 需要结构化最终结果时：画布配置 **workflowEnd** 结束节点
- [ ] **流式**：\`stream: true\`，解析 SSE；可监听 \`workflow_finished\`
- [ ] **阻塞**：\`stream: false\`，解析 JSON \`data.outputs\`
- [ ] HTTP 读超时足够长（大模型可能数十秒至数分钟）
- [ ] 生产环境使用 HTTPS，Key 勿写入前端公开代码

---

## 10. 常见问题

| 问题 | 排查 |
|------|------|
| 401 API Key 无效 | 使用了 keyPrefix 而非完整 Key；Key 已删除 |
| 403 appId 不匹配 | Body 的 appId 与创建 Key 时的 agentId 不一致 |
| blocking 返回 outputs 为空 | 未配置 workflowEnd 或未引用上游变量 |
| 流式无 workflow_finished | 流程未执行到结束节点 |
| 连接成功但无输出 | agentSetting 为空或缺少 workflowStart |

---

## 11. 相关能力

| 能力 | 说明 |
|------|------|
| API 密钥管理 | 本页左侧「API 密钥」 |
| 附件上传 | 本页「附件上传」文档 |
| 完整规范 | 项目文档 \`doc/智能体开放API接口文档.md\` |
`;
}
