import { Router } from 'express';
import { callMcpToolJson } from '../mcp/client.js';
import { parseNutritionText } from '../mcp/parse.js';

const router = Router();

/**
 * GET /api/wiki?storeCode=xxx
 * 单品图鉴列表：全菜单按品类，含 code / name / image。
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
    const normalized = categories.map((cat) => ({
      category: cat.name,
      meals: (cat.meals || []).map((m: any) => {
        const d = mealsMap[m.code] || {};
        return { code: m.code, name: d.name, image: d.image, tags: m.tags || [] };
      })
    }));
    res.json({ categories: normalized });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/wiki/detail?storeCode=xxx&code=yyy
 * 单品详情：图片、名字、组成（rounds=配料/套餐构成）、热量（按名称匹配 list-nutrition-foods）。
 * query-meal-detail 返回 data.{ code, name, rounds[], image, supportModify }
 *   rounds[] = { id, name, quantity, choices:[{ code, name, diffPrice, isDefault }] }
 * list-nutrition-foods 返回文本表格（productName/energyKcal/...），无图片、无成分。
 */
router.get('/detail', async (req, res) => {
  try {
    const storeCode = req.query.storeCode as string;
    const code = req.query.code as string;
    if (!storeCode || !code) return res.status(400).json({ error: 'storeCode & code required' });

    const detail = await callMcpToolJson('query-meal-detail', {
      storeCode,
      orderType: 1,
      beType: 1,
      code
    });
    const d = detail?.data || {};

    // 热量：list-nutrition-foods 返回 { success, data:"[160]{...}:\\n 餐品,..." }
    // data 是 JSON 字符串字段，换行被转义，需先 extractJson 取外层再解析
    let nutrition: any = null;
    try {
      const nutriResp = await callMcpToolJson('list-nutrition-foods', {});
      const nutriText: string = nutriResp?.data;
      const list = typeof nutriText === 'string' ? parseNutritionText(nutriText) : [];
      const name: string = d.name || '';
      const cleanName = name.replace(/[“”"]/g, '');
      nutrition =
        list.find((n) => n.productName && name.includes(n.productName)) ||
        list.find((n) => n.productName && n.productName.includes(cleanName)) ||
        null;
    } catch {
      nutrition = null;
    }

    res.json({
      code: d.code,
      name: d.name,
      image: d.image,
      supportModify: d.supportModify,
      composition: (d.rounds || []).map((r: any) => ({
        roundId: r.id,
        name: r.name,
        quantity: r.quantity,
        choices: (r.choices || []).map((c: any) => ({
          code: c.code,
          name: c.name,
          diffPrice: c.diffPrice,
          isDefault: c.isDefault
        }))
      })),
      nutrition: nutrition
        ? {
            energyKcal: nutrition.energyKcal,
            energyKj: nutrition.energyKj,
            protein: nutrition.protein,
            fat: nutrition.fat,
            carbohydrate: nutrition.carbohydrate,
            sodium: nutrition.sodium,
            calcium: nutrition.calcium
          }
        : null
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
