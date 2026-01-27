import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'support module' });
});

export default router;
