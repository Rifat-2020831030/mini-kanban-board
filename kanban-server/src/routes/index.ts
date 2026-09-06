import { Router } from 'express';
export const routes = Router();

routes.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
