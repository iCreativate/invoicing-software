import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Accounting routes will be implemented here
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Accounting module - coming soon' });
});

export default router;

