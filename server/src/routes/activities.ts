import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// GET /api/activities  读库（由 scheduler 每日更新），首页用
router.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM activities ORDER BY start_date ASC')
    .all();
  res.json(rows);
});

export default router;
