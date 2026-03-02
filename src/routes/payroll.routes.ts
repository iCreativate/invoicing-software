import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPayrolls, getPayrollById, createPayroll, updatePayrollStatus } from '../controllers/payroll.controller';

const router = Router();

router.use(authenticate);

router.get('/', getPayrolls);
router.get('/:id', getPayrollById);
router.post('/', createPayroll);
router.patch('/:id', updatePayrollStatus);

export default router;

