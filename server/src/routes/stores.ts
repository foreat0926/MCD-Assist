import { Router } from 'express';
import { callMcpToolJson } from '../mcp/client.js';

const router = Router();

/**
 * GET /api/stores/nearby?city=上海&keyword=麦当劳
 * 到店自取场景：beType=1, searchType=2（按位置搜索）。注意 mcp 要求 city 与 keyword 同时非空。
 * query-nearby-stores 返回 data[]：storeCode/storeName/address/distance/businessStatus/
 *   businessStartTime/businessEndTime/reservation/reservationTimeOptions
 */
router.get('/nearby', async (req, res) => {
  try {
    const city = (req.query.city as string) || '上海';
    const keyword = (req.query.keyword as string) || '麦当劳';
    const beType = 1; // 到店自取
    const searchType = 2; // 按位置搜索
    const result = await callMcpToolJson('query-nearby-stores', {
      beType,
      searchType,
      city,
      keyword
    });
    const raw: any[] = Array.isArray(result?.data) ? result.data : [];
    const stores = raw.map((s) => ({
      storeCode: s.storeCode,
      storeName: s.storeName,
      address: s.address,
      distance: s.distance,
      businessStatus: s.businessStatus,
      businessStartTime: s.businessStartTime,
      businessEndTime: s.businessEndTime,
      reservation: s.reservation,
      reservationTimeOptions: s.reservationTimeOptions || []
    }));
    res.json({ stores });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
