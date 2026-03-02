import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Vendor routes will be implemented here
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Vendor module - coming soon' });
});

export default router;

