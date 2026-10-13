import 'dotenv/config';
import express from 'express';
import { initDb } from './db/index.js';
import { startScheduler } from './scheduler/activities.js';
import storesRouter from './routes/stores.js';
import couponsRouter from './routes/coupons.js';
import menuRouter from './routes/menu.js';
import wikiRouter from './routes/wiki.js';
import activitiesRouter from './routes/activities.js';
import optimizerRouter from './routes/optimizer.js';

initDb();

const app = express();
app.use(express.json());

// 简易 CORS（H5 前端跨域调用；本工具无登录态/无 Cookie，开发期放开，生产可收紧来源）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/stores', storesRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/wiki', wikiRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/optimizer', optimizerRouter);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`MCD-Assist server listening on :${PORT}`);
});
startScheduler();
