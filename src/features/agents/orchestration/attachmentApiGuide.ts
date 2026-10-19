const apiAbsoluteUrl = (path: string) => new URL(path, window.location.origin).toString();

/** 第三方集成场景下的附件上传说明（基于附件管理接口文档） */
export function buildAttachmentApiGuideMarkdown(agentId: string) {
  const fileBase = apiAbsoluteUrl('/gpt/file');
  const openApiBase = apiAbsoluteUrl('/gpt/open/v1/workflows/run');

  return `# 附件上传接口说明（第三方集成）

> 调用开放 API 时若需传递文件，需**先上传附件**获取 \`fileId\`，再在 \`POST /gpt/open/v1/workflows/run\` 请求的 \`files\` 字段中引用。

---

## 1. 集成流程

1. 使用平台登录 Token 调用文件服务上传接口（附件接口不走 API Key 鉴权）
2. 从响应中获取附件 \`id\` 作为 \`fileId\`
3. 调用开放 API 时在 \`files\` 数组中传入 \`{ type, fileId }\`
4. 后端会将附件合并进流程变量 \`variables.files\`

\`\`\`text
上传附件 (Token)  →  获得 fileId  →  开放 API 调用 (API Key + X-User-Id)
\`\`\`

---

## 2. 单文件上传

**POST** \`${fileBase}/upload\`

**Content-Type**：\`multipart/form-data\`

| 参数 | 位置 | 必填 | 说明 |
|------|------|------|------|
| multipartFile | form-data | **是** | 文件字段名固定为 \`multipartFile\` |
| srcVoucherCode | query | **是** | 业务标识，第三方集成建议 \`open-api\` |
| srcVoucherId | query | **是** | 业务单据 ID，可用智能体 ID 或会话 ID |
| status | query | 否 | \`0\` 临时 / \`1\` 正式，默认 \`1\` |

**鉴权 Header**（管理端 Token，非 API Key）：

\`\`\`http
token: <登录Token>
Authorization: Bearer <登录Token>
\`\`\`

**响应示例**：

\`\`\`json
{
  "code": 200,
  "data": {
    "id": ["1860000000000000001"],
    "fileNames": ["产品说明.pdf"]
  }
}
\`\`\`

---

## 3. cURL 上传示例

\`\`\`bash
curl -X POST '${fileBase}/upload?srcVoucherCode=open-api&srcVoucherId=${agentId}&status=1' \\
  -H 'token: YOUR_LOGIN_TOKEN' \\
  -F 'multipartFile=@/path/to/document.pdf'
\`\`\`

---

## 4. JavaScript 上传示例

\`\`\`javascript
async function uploadAttachment(file, loginToken, agentId) {
  const formData = new FormData();
  formData.append('multipartFile', file);
  const qs = new URLSearchParams({
    srcVoucherCode: 'open-api',
    srcVoucherId: agentId,
    status: '1'
  });
  const res = await fetch('${fileBase}/upload?' + qs, {
    method: 'POST',
    headers: { token: loginToken },
    body: formData
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data.id[0]; // fileId
}
\`\`\`

---

## 5. 在开放 API 中引用附件

上传成功后，将 \`fileId\` 传入工作流执行接口：

\`\`\`bash
curl -N -X POST '${openApiBase}' \\
  -H 'Authorization: Bearer ag-your-api-key' \\
  -H 'X-User-Id: user-001' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: text/event-stream' \\
  -d '{
    "appId": "${agentId}",
    "stream": true,
    "chatGroupId": "session-001",
    "message": [{ "role": "user", "content": "请分析这份文档" }],
    "files": [
      { "type": "document", "fileId": "1860000000000000001", "content": null }
    ]
  }'
\`\`\`

**FileInfo 字段说明**：

| 字段 | 说明 |
|------|------|
| type | \`image\` / \`document\` / \`video\` / \`base64\` |
| fileId | 上传接口返回的附件 ID |
| content | 内联内容（部分场景，通常传 null） |

---

## 6. 允许的文件类型

\`txt, doc, docx, csv, xls, xlsx, zip, pdf, ppt, pptx, bmp, mp3, mp4, flv, svg, jpg, jpeg, png\`

不在白名单内的扩展名将上传失败。

---

## 7. 其他附件接口

| 接口 | 说明 |
|------|------|
| POST /gpt/file/uploads | 多文件上传 |
| GET /gpt/file/getFileById?id= | 查询附件详情 |
| GET /gpt/file/download?id= | 下载（免登录） |
| GET /gpt/file/online?id= | 在线预览（免登录） |

---

## 8. 注意事项

- 附件上传使用**平台登录 Token**，开放 API 调用使用 **API Key**，两者鉴权方式不同
- \`srcVoucherId\` 建议使用智能体 ID（\`${agentId}\`）或业务会话 ID，便于追溯
- 开始节点默认 \`files\` 变量会接收附件列表，可在流程中引用
- 单文件上传大小限制默认 **1024MB**（以服务端配置为准）
`;
}
