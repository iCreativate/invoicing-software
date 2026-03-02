import { Router } from 'express';
import { getCompany, updateCompany, uploadLogo, uploadMiddleware } from '../controllers/company.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:id', authenticate, getCompany);
router.put('/:id', authenticate, updateCompany);
router.post('/:id/logo', authenticate, uploadMiddleware, uploadLogo);

export default router;

