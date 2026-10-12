import { Router } from 'express';
import { db } from '../db/index.js';
import { getOpenidFromReq } from '../auth/wechat.js';
import { callMcpToolJson } from '../mcp/client.js';

const router = Router();

/**
 * POST /api/orders
 * body: { storeCode, orderType(默认1), beType(默认1), items:[{productCode,quantity,roundList?}], takeWay? }
 * 调 create-order（真实下单，涉及金额，需前端在用户明确确认后触发）并存库。
 * create-order 返回结构含订单号/支付参数等，原样回传前端。
 */
router.post('/', async (req, res) => {
  try {
    const openid = getOpenidFromReq(req);
    if (!openid) return res.status(401).json({ error: 'unauthorized' });
    const { storeCode, items, orderType, beType, takeWay } = (req.body || {}) as any;
    if (!storeCode || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'storeCode & items required' });
    const plan = {
      storeCode,
      orderType: orderType ?? 1,
      beType: beType ?? 1,
      ...(takeWay ? { takeWay } : {}),
      items: items.map((it: any) => ({
        productCode: it.productCode,
        quantity: it.quantity,
        ...(it.roundList ? { roundList: it.roundList } : {})
      }))
    };
    const mcpResult = await callMcpToolJson('create-order', plan);
    const orderRef =
      mcpResult?.orderId ?? mcpResult?.order_id ?? mcpResult?.data?.orderId ?? null;
    const info = db
      .prepare(
        'INSERT INTO orders(openid, mcd_order_ref, plan_json, total, status, created_at) VALUES(?,?,?,?,?,?)'
      )
      .run(openid, orderRef, JSON.stringify(plan), null, 'created', Date.now());
    res.json({ id: info.lastInsertRowid, mcp: mcpResult });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders  当前用户订单列表
router.get('/', (req, res) => {
  const openid = getOpenidFromReq(req);
  if (!openid) return res.status(401).json({ error: 'unauthorized' });
  const rows = db
    .prepare('SELECT * FROM orders WHERE openid=? ORDER BY created_at DESC')
    .all(openid);
  res.json(rows);
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const openid = getOpenidFromReq(req);
  if (!openid) return res.status(401).json({ error: 'unauthorized' });
  const row = db
    .prepare('SELECT * FROM orders WHERE id=? AND openid=?')
    .get(req.params.id, openid);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

export default router;
