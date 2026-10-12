import { db } from '../db/index.js';
import { callMcpToolJson } from '../mcp/client.js';
import cron from 'node-cron';

/**
 * 拉取未来 7 天开始的活动并写入 activities 表。
 * 数据源：mcd-mcp 的 campaign-calendar（辅 query-promotions）。
 * 注：campaign-calendar 返回结构待 Phase 2 接入时确认，这里先做容错与 upsert 骨架。
 */
/**
 * 解析 campaign-calendar 返回的 Markdown 文本，提取活动列表。
 * 结构示例：
 *   #### 2026年10月12日 今日
 *   - **活动标题**：...
 *     活动图片介绍：<img src="...">
 */
function parseCampaignMarkdown(md: string): any[] {
  const activities: any[] = [];
  const sectionRe = /####\s*(.+?)\n([\s\S]*?)(?=####|$)/g;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(md)) !== null) {
    const dateLabel = m[1].trim();
    const body = m[2];
    const itemRe = /-\s*\*\*(.+?)\*\*([\s\S]*?)(?=\n\s*-\s*\*\*|$)/g;
    let im: RegExpExecArray | null;
    while ((im = itemRe.exec(body)) !== null) {
      const title = im[1].trim();
      const rest = im[2];
      const img = rest.match(/<img[^>]*src="([^"]+)"/);
      const summary = rest
        .replace(/<img[^>]*>/g, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
      activities.push({
        id: `${dateLabel}-${title}`.slice(0, 120),
        title,
        type: 'campaign',
        start_date: dateLabel,
        end_date: '',
        summary,
        detail: rest.replace(/<img[^>]*>/g, '').trim(),
        source: 'campaign-calendar',
        image: img ? img[1] : ''
      });
    }
  }
  return activities;
}

export async function refreshActivities(): Promise<void> {
  try {
    const data = await callMcpToolJson('campaign-calendar', {});
    // campaign-calendar 返回 Markdown 文本（callMcpToolJson 解析 JSON 失败后会回退为 text 字符串）
    const md = typeof data === 'string' ? data : JSON.stringify(data);
    const list = parseCampaignMarkdown(md);
    const now = Date.now();
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO activities
       (id, title, type, start_date, end_date, summary, detail, source, updated_at)
       VALUES (@id, @title, @type, @start_date, @end_date, @summary, @detail, @source, @updated_at)`
    );
    const upsert = db.transaction((items: any[]) => {
      for (const it of items) {
        stmt.run({
          id: it.id,
          title: it.title,
          type: it.type,
          start_date: it.start_date,
          end_date: it.end_date,
          summary: it.summary,
          detail: it.detail,
          source: it.source,
          updated_at: now
        });
      }
    });
    upsert(list);
    console.log(`[scheduler] activities refreshed, parsed=${list.length}`);
  } catch (e: any) {
    console.error('[scheduler] refresh activities failed:', e.message);
  }
}

export function startScheduler(): void {
  // 每日 00:00 触发
  cron.schedule('0 0 0 * * *', () => {
    refreshActivities();
  });
  // 启动立即拉一次
  refreshActivities();
}
