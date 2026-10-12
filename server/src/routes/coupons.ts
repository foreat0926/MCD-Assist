import { Router } from 'express';
import { callMcpToolJson, callMcpToolText } from '../mcp/client.js';
import { parseCouponMarkdown } from '../mcp/parse.js';

const router = Router();

/**
 * GET /api/coupons?storeCode=xxx
 * 聚合优惠券中心：
 *   - available：麦麦省可领取券（available-coupons，Markdown -> 解析 title/status/image）
 *   - mine：用户卡包（query-my-coupons，文本；无券时返回 []）
 *   - store：当前门店可用券（query-store-coupons，data[]）
 */
router.get('/', async (req, res) => {
  try {
    const storeCode = req.query.storeCode as string;
    const [availableRaw, mineRaw, storeRaw] = await Promise.all([
      callMcpToolText('available-coupons', {}),
      callMcpToolText('query-my-coupons', {}),
      storeCode
        ? callMcpToolJson('query-store-coupons', { storeCode, orderType: 1, beType: 1 })
        : Promise.resolve(null)
    ]);
    const available = parseCouponMarkdown(availableRaw);
    const mine =
      mineRaw && mineRaw.includes('暂无') ? [] : { raw: mineRaw };
    const store = Array.isArray(storeRaw?.data) ? storeRaw.data : [];
    res.json({ available, mine, store });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/coupons/auto-bind
 * 一键领取麦麦省所有当前可用券（auto-bind-coupons）。会真实改写用户卡包，需前端明确触发。
 */
router.post('/auto-bind', async (_req, res) => {
  try {
    const result = await callMcpToolJson('auto-bind-coupons', {});
    res.json({ result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
