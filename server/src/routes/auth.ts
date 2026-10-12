import { Router } from 'express';
import { code2Session, signToken } from '../auth/wechat.js';
import { db } from '../db/index.js';

const router = Router();

// POST /api/auth/login  { code } -> { token, openid }
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code required' });
    const { openid } = await code2Session(code);
    const token = signToken(openid);
    db.prepare(
      'INSERT OR REPLACE INTO users(openid, token, created_at) VALUES(?,?,?)'
    ).run(openid, token, Date.now());
    res.json({ token, openid });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
