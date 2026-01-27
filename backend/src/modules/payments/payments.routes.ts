import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'payments module' });
});

export default router;
