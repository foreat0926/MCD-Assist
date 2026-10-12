import { Router } from 'express';
import { callMcpToolJson } from '../mcp/client.js';
import { fenToYuan } from '../mcp/parse.js';

const router = Router();

interface Item {
  productCode: string;
  quantity: number;
  roundList?: any[];
}

/** 调一次 calculate-price，返回结构化结果；失败返回 null（如时段不可售 500） */
async function priceOnce(
  storeCode: string,
  items: Item[],
  couponId?: string,
  couponCode?: string
): Promise<{ price: number; productList: any[]; originalPrice: number; discount: number } | null> {
  try {
    const pricedItems = items.map((it) => ({
      productCode: it.productCode,
      quantity: it.quantity,
      ...(it.roundList ? { roundList: it.roundList } : {}),
      ...(couponId ? { couponId } : {}),
      ...(couponCode ? { couponCode } : {})
    }));
    const r = await callMcpToolJson('calculate-price', {
      storeCode,
      orderType: 1,
      beType: 1,
      items: pricedItems
    });
    const d = r?.data;
    if (!d || !Array.isArray(d.productList)) return null;
    return {
      price: fenToYuan(d.price) ?? 0,
      productList: (d.productList || []).map((p: any) => ({
        productCode: p.productCode,
        productName: p.productName,
        quantity: p.quantity,
        subtotal: fenToYuan(p.subtotal)
      })),
      originalPrice: fenToYuan(d.originalPrice) ?? 0,
      discount: fenToYuan(d.discount) ?? 0
    };
  } catch {
    return null;
  }
}

/** 取门店可用券（含 couponId/couponCode/name） */
async function getStoreCoupons(storeCode: string): Promise<any[]> {
  try {
    const r = await callMcpToolJson('query-store-coupons', {
      storeCode,
      orderType: 1,
      beType: 1
    });
    return Array.isArray(r?.data) ? r.data : [];
  } catch {
    return [];
  }
}

/** 找一个最便宜的饮料/小食，用于「凑单参考」 */
async function findCheapAddon(storeCode: string): Promise<Item | null> {
  try {
    const m = await callMcpToolJson('query-meals', { storeCode, orderType: 1, beType: 1 });
    const cats: any[] = m?.data?.categories || [];
    const map: Record<string, any> = m?.data?.meals || {};
    let best: { code: string; price: number } | null = null;
    // 优先在含「饮料/饮品/小食」的品类里找
    const targetCat = cats.find((c) => /饮料|饮品|小食|甜品/.test(c.name || '')) || cats[0];
    for (const meal of targetCat?.meals || []) {
      const d = map[meal.code] || {};
      const price = d.currentPrice == null || d.currentPrice === '' ? null : Number(d.currentPrice);
      if (price == null || !Number.isFinite(price)) continue;
      if (!best || price < best.price) best = { code: meal.code, price };
    }
    return best ? { productCode: best.code, quantity: 1 } : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/optimizer
 * 输入：{ storeCode, items:[{productCode,quantity,roundList?}], bindFirst? }
 * 主方案：严格按所选商品，基准价 + 逐门店券试算取最低。
 * 参考方案：额外 +1 杯最便宜饮料/小食，重新求最优（用于满减凑单参考）。
 */
router.post('/', async (req, res) => {
  try {
    const { storeCode, items, bindFirst } = (req.body || {}) as {
      storeCode?: string;
      items?: Item[];
      bindFirst?: boolean;
    };
    if (!storeCode) return res.status(400).json({ error: 'storeCode required' });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'items required' });

    if (bindFirst) {
      try {
        await callMcpToolJson('auto-bind-coupons', {});
      } catch {
        /* 领券失败不阻断 */
      }
    }

    const baseline = await priceOnce(storeCode, items);
    if (!baseline) {
      return res.status(502).json({ error: 'calculate-price failed (门店可能已打烊或商品不可售)' });
    }

    const coupons = await getStoreCoupons(storeCode);
    let best = { ...baseline, coupon: null as any };
    for (const c of coupons) {
      const cid = c.couponId || c.id;
      const ccode = c.couponCode || c.code;
      const priced = await priceOnce(storeCode, items, cid, ccode);
      if (priced && priced.price < best.price) {
        best = { ...priced, coupon: { couponId: cid, couponCode: ccode, name: c.name || c.title || null } };
      }
    }

    // 参考方案：+1 最便宜饮料/小食
    let reference: any = null;
    const addon = await findCheapAddon(storeCode);
    if (addon) {
      const refItems = [...items, addon];
      const refBaseline = await priceOnce(storeCode, refItems);
      if (refBaseline) {
        let refBest = { ...refBaseline, coupon: null as any };
        for (const c of coupons) {
          const priced = await priceOnce(storeCode, refItems, c.couponId || c.id, c.couponCode || c.code);
          if (priced && priced.price < refBest.price) {
            refBest = { ...priced, coupon: { couponId: c.couponId || c.id, couponCode: c.couponCode || c.code, name: c.name || c.title || null } };
          }
        }
        reference = {
          addedItem: addon,
          price: refBest.price,
          originalPrice: refBest.originalPrice,
          discount: refBest.discount,
          coupon: refBest.coupon,
          productList: refBest.productList,
          note: '在所选商品基础上额外加 1 件最便宜饮料/小食后的最优价，仅作凑单参考'
        };
      }
    }

    res.json({
      mainPlan: {
        price: best.price,
        originalPrice: best.originalPrice,
        discount: best.discount,
        coupon: best.coupon,
        productList: best.productList,
        baselinePrice: baseline.price
      },
      referencePlan: reference
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
