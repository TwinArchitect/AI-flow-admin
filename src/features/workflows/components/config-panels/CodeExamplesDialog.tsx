import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EXAMPLES = [
  {
    title: '获取附件链接 url',
    description: '从附件列表（JSON / Java List）中提取 url，换行拼接返回',
    code: `function main(str1) {
  var list;
  try {
    if (typeof str1 === 'string') {
      var parsed = JSON.parse(str1);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } else if (str1 != null && typeof str1.size === 'function') {
      list = [];
      for (var i = 0; i < str1.size(); i++) list.push(str1.get(i));
    } else if (Array.isArray(str1)) {
      list = str1;
    } else {
      list = [str1];
    }
  } catch (e) {
    return 'ERR:' + e;
  }
  var urls = [];
  for (var j = 0; j < list.length; j++) {
    var item = list[j];
    if (!item) continue;
    var url = item.url;
    if (url == null && typeof item.get === 'function') url = item.get('url');
    if (url) urls.push(String(url));
  }
  return urls.join('\\n');
}
return main(arg0);`,
  },
  {
    title: '字符串转 JSON',
    description: '将入参字符串安全解析为 JSON 对象；失败返回 null',
    code: `function main(str1) {
  if (str1 == null) return null;
  if (typeof str1 === 'object') return str1;
  var text = String(str1).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}
return main(arg0);`,
  },
];

const PYTHON_EXAMPLES = [
  { title: '获取附件链接 url', description: '从附件列表提取链接并换行拼接', code: `import json

def main(files):
    if isinstance(files, str):
        files = json.loads(files)
    if not isinstance(files, list):
        files = [files]
    return "\\n".join(str(item["url"]) for item in files if isinstance(item, dict) and item.get("url"))
` },
  { title: '字符串转 JSON', description: '解析 JSON，失败返回 None', code: `import json

def main(value):
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except (ValueError, TypeError):
        return None
` },
];

export function CodeExamplesDialog({ language = 'js', open, onOpenChange, onSelect }: {
  language?: 'js' | 'py';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (code: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>代码示例</DialogTitle>
          <DialogDescription>选择示例后会替换当前代码。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {(language === 'py' ? PYTHON_EXAMPLES : EXAMPLES).map((example) => (
            <Button
              key={example.title}
              type="button"
              variant="outline"
              className="h-auto items-start justify-start whitespace-normal p-4 text-left"
              onClick={() => { onSelect(example.code); onOpenChange(false); }}
            >
              <span><span className="block font-medium">{example.title}</span><span className="mt-1 block text-xs text-muted-foreground">{example.description}</span></span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
