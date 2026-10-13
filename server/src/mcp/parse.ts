// mcd-mcp 返回数据的解析工具
// 许多工具返回 Markdown 说明 + 内嵌 JSON，或纯文本表格，这里做针对性解析。

/** 分 -> 元（mcd 价格字段单位为「分」）。null/undefined 返回 null。 */
export function fenToYuan(fen: number | null | undefined): number | null {
  if (fen == null) return null;
  return Math.round(fen) / 100;
}

/**
 * 解析 list-nutrition-foods 的文本表格。
 * 形如：
 *   [160]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:
 *     猪柳麦满分,null,1288,308,16,16,24,781,213
 *     猪柳蛋麦满分,null,1618,387,23,21,25,846,243
 * 返回数组，每个元素含：productName, energyKj, energyKcal, protein, fat, carbohydrate, sodium, calcium
 */
export interface NutritionItem {
  productName: string;
  nutritionDescription: string | null;
  energyKj: number | null;
  energyKcal: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  sodium: number | null;
  calcium: number | null;
}

export function parseNutritionText(text: string): NutritionItem[] {
  const lines = text.split('\n');
  const out: NutritionItem[] = [];
  // 跳过头部的 [n]{字段名} 说明行，从数据行开始解析
  let inData = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('[') && line.includes(']{')) {
      // 字段定义行，标记后面开始是数据
      inData = true;
      continue;
    }
    if (!inData) continue;
    // 数据行：逗号分隔
    const parts = line.split(',');
    if (parts.length < 9) continue;
    const num = (s: string): number | null => {
      const v = s?.trim();
      if (!v || v.toLowerCase() === 'null') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    out.push({
      productName: parts[0].trim(),
      nutritionDescription: parts[1]?.trim() === 'null' ? null : (parts[1]?.trim() || null),
      energyKj: num(parts[2]),
      energyKcal: num(parts[3]),
      protein: num(parts[4]),
      fat: num(parts[5]),
      carbohydrate: num(parts[6]),
      sodium: num(parts[7]),
      calcium: num(parts[8])
    });
  }
  return out;
}

/**
 * 解析 available-coupons 的 Markdown 列表。
 * 形如：
 *   - 优惠券标题：中薯条买一送一 \
 *     状态：可领取 \
 *     优惠券图片：\
 *       <img src="https://..." alt="..." ...>
 * 返回数组：{ title, status, image }
 */
export interface CouponItem {
  title: string;
  status: string | null;
  image: string | null;
}

export function parseCouponMarkdown(text: string): CouponItem[] {
  const out: CouponItem[] = [];
  // 按 "- 优惠券标题：" 分段
  const blocks = text.split(/-\s*优惠券标题：/).slice(1);
  for (const block of blocks) {
    const titleMatch = block.match(/^([^\n\\]+)/);
    const title = titleMatch ? titleMatch[1].trim() : null;
    const statusMatch = block.match(/状态：([^\n\\]+)/);
    const status = statusMatch ? statusMatch[1].trim() : null;
    const imgMatch = block.match(/<img[^>]*src="([^"]+)"/);
    const image = imgMatch ? imgMatch[1] : null;
    if (title) out.push({ title, status, image });
  }
  return out;
}

