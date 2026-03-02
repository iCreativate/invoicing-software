import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generateTermsAndConditions } from '../controllers/ai.controller';

const router = Router();

router.use(authenticate);

// Generate Terms & Conditions for invoices
router.post('/generate-terms', generateTermsAndConditions);

// AI routes placeholder
router.get('/', (req, res) => {
  res.json({ success: true, message: 'AI module - Terms & Conditions generation available' });
});

export default router;

