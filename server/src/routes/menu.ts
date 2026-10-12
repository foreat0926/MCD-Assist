import { Router } from 'express';
import { callMcpToolJson } from '../mcp/client.js';

const router = Router();

/**
 * GET /api/menu?storeCode=xxx
 * query-meals 返回：
 *   data.categories[] = { name, meals:[{ code, tags }] }
 *   data.meals = { [code]: { name, image, currentPrice, originalPrice, discountType, canWithOrder, withOrder } }
 * 注意：query-meals 的 currentPrice/originalPrice 是「字符串、单位元」（如 "26" / "23.5"），
 * 与 calculate-price（整数「分」）不同，此处直接 parseFloat 即可。
 */
router.get('/', async (req, res) => {
  try {
    const storeCode = req.query.storeCode as string;
    if (!storeCode) return res.status(400).json({ error: 'storeCode required' });
    const result = await callMcpToolJson('query-meals', {
      storeCode,
      orderType: 1,
      beType: 1
    });
    const categories: any[] = result?.data?.categories || [];
    const mealsMap: Record<string, any> = result?.data?.meals || {};
    const yuan = (v: any): number | null => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const normalized = categories.map((cat) => ({
      category: cat.name,
      meals: (cat.meals || []).map((m: any) => {
        const d = mealsMap[m.code] || {};
        return {
          code: m.code,
          tags: m.tags || [],
          name: d.name,
          image: d.image,
          currentPrice: yuan(d.currentPrice),
          originalPrice: yuan(d.originalPrice),
          discountType: d.discountType ?? null
        };
      })
    }));
    res.json({ categories: normalized });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
