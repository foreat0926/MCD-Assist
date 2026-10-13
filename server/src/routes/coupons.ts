import { Router } from 'express';
import { callMcpToolJson, callMcpToolText } from '../mcp/client.js';
import { parseCouponMarkdown } from '../mcp/parse.js';

const router = Router();

/**
 * GET /api/coupons?storeCode=xxx
 * 优惠信息（模拟工具，仅展示，不领取、不绑定、不涉及账号）：
 *   - available：麦麦省可领取券（available-coupons，Markdown -> 解析 title/status/image），公开参考
 *   - store：当前店面可用券（query-store-coupons，data[]），供优惠试算参考
 */
router.get('/', async (req, res) => {
  try {
    const storeCode = req.query.storeCode as string;
    const [availableRaw, storeRaw] = await Promise.all([
      callMcpToolText('available-coupons', {}),
      storeCode
        ? callMcpToolJson('query-store-coupons', { storeCode, orderType: 1, beType: 1 })
        : Promise.resolve(null)
    ]);
    const available = parseCouponMarkdown(availableRaw);
    const store = Array.isArray(storeRaw?.data) ? storeRaw.data : [];
    res.json({ available, store });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
