import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from '../controllers/banking.controller';

const router = Router();

router.use(authenticate);

router.get('/accounts', getBankAccounts);
router.post('/accounts', createBankAccount);
router.put('/accounts/:id', updateBankAccount);
router.delete('/accounts/:id', deleteBankAccount);

export default router;

