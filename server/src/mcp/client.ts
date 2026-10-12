import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = process.env.MCP_MCD_URL || 'https://mcp.mcd.cn';
const MCP_TOKEN = process.env.MCP_MCD_TOKEN || '';

let client: Client | null = null;

/**
 * 获取（复用）mcd-mcp 客户端。
 * mcd-mcp 是远程 Streamable HTTP 服务，需 Bearer token 鉴权。
 */
export async function getMcpClient(): Promise<Client> {
  if (client) return client;
  client = new Client({ name: 'mcd-assist', version: '0.1.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: { Authorization: `Bearer ${MCP_TOKEN}` }
    }
  });
  await client.connect(transport);
  return client;
}

/** 调用任意 mcd-mcp 工具，返回原始 MCP 响应 */
export async function callMcpTool(name: string, args: Record<string, unknown> = {}): Promise<any> {
  const c = await getMcpClient();
  const res = await c.callTool({ name, arguments: args });
  return res;
}

/** 从 MCP 文本响应里提取内嵌 JSON（很多工具返回 Markdown 说明 + 内嵌 {"success":...} 块） */
export function extractJson(text: string): any {
  if (typeof text !== 'string') return text;
  let start = text.indexOf('{"success"');
  if (start < 0) start = text.indexOf('{');
  if (start < 0) return text;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, i + 1));
          } catch {
            return text;
          }
        }
      }
    }
  }
  return text;
}

function contentToText(res: any): string {
  const content = res?.content;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item && item.type === 'text') return item.text;
    }
  }
  return typeof res === 'string' ? res : JSON.stringify(res);
}

/** 调用工具并尝试把返回内容解析为结构化 JSON；解析失败则回退为原始文本字符串 */
export async function callMcpToolJson(name: string, args: Record<string, unknown> = {}): Promise<any> {
  const res = await callMcpTool(name, args);
  return extractJson(contentToText(res));
}

/** 调用工具并返回原始文本（用于 Markdown / 文本表格类响应，如 list-nutrition-foods、available-coupons） */
export async function callMcpToolText(name: string, args: Record<string, unknown> = {}): Promise<string> {
  const res = await callMcpTool(name, args);
  return contentToText(res);
}
