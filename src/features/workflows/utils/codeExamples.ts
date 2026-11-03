export type CodeExampleItem = {
  id: string;
  title: string;
  description?: string;
  code: string;
};

export const CODE_EXAMPLES: CodeExampleItem[] = [
  {
    id: 'file-url-extract',
    title: '获取附件链接 url',
    description: '从附件列表（JSON / Java List）中提取 url，换行拼接返回',
    code: `function main(str1) {
    var list;
    try {
        if (typeof str1 === 'string') {
            var parsed = JSON.parse(str1);
            list = Array.isArray(parsed) ? parsed : [parsed];
        } else if (str1 != null && typeof str1.size === 'function') {
            // Java List
            list = [];
            for (var i = 0; i < str1.size(); i++) {
                list.push(str1.get(i));
            }
        } else if (Array.isArray(str1)) {
            list = str1;
        } else {
            list = [str1];
        }
    } catch (e) {
        return 'ERR:' + e;  // 调试时先别吞成空串
    }

    var urls = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item) continue;
        var url = item.url;
        if (url == null && typeof item.get === 'function') {
            url = item.get('url');  // Java Map / JSONObject
        }
        if (url) urls.push(String(url));
    }
    return urls.join('\\n');
}
return main(arg0);`
  },
  {
    id: 'string-to-json',
    title: '字符串转 JSON',
    description: '将入参字符串安全解析为 JSON 对象；失败返回 null',
    code: `function main(str1) {
    if (str1 == null) return null;
    // 已是对象 / 数组（引擎已反序列化）直接返回
    if (typeof str1 === 'object') {
        return str1;
    }
    var text = String(str1).trim();
    if (!text) return null;
    return JSON.parse(text);
}
return main(arg0);`
  }
];


export const PYTHON_CODE_EXAMPLES: CodeExampleItem[] = [
  {
    id: 'python-file-url-extract',
    title: '获取附件链接 url',
    description: '从附件对象或 JSON 字符串提取 url，返回 urls 字段',
    code: `import json

def main(arg0):
    items = json.loads(arg0) if isinstance(arg0, str) else arg0
    if not isinstance(items, list):
        items = [items]
    urls = [str(item["url"]) for item in items if isinstance(item, dict) and item.get("url")]
    return {"urls": "\\n".join(urls)}
`
  },
  {
    id: 'python-string-to-json',
    title: '字符串转 JSON',
    description: '将 JSON 字符串解析为对象，已是对象时直接返回',
    code: `import json

def main(arg0):
    return json.loads(arg0) if isinstance(arg0, str) else arg0
`
  },
  {
    id: 'python-sum',
    title: '数值求和',
    description: '按输入顺序接收两个参数，返回 total 字段',
    code: `def main(arg0, arg1):
    return {"total": float(arg0) + float(arg1)}
`
  }
];
