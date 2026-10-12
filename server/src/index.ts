import 'dotenv/config';
import express from 'express';
import { initDb } from './db/index.js';
import { startScheduler } from './scheduler/activities.js';
import authRouter from './routes/auth.js';
import storesRouter from './routes/stores.js';
import couponsRouter from './routes/coupons.js';
import menuRouter from './routes/menu.js';
import wikiRouter from './routes/wiki.js';
import activitiesRouter from './routes/activities.js';
import optimizerRouter from './routes/optimizer.js';
import ordersRouter from './routes/orders.js';

initDb();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/stores', storesRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/wiki', wikiRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/optimizer', optimizerRouter);
app.use('/api/orders', ordersRouter);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`MCD-Assist server listening on :${PORT}`);
});
startScheduler();
