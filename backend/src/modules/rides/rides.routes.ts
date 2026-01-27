import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'rides module' });
});

export default router;
