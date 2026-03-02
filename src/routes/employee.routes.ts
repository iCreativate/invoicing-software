import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Employee routes will be implemented here
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Employee module - coming soon' });
});

export default router;

