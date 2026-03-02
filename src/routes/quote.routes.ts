import { Router } from 'express';
import {
  createQuote,
  getQuotes,
  getQuote,
  updateQuote,
  deleteQuote,
  sendQuote,
} from '../controllers/quote.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createQuote);
router.get('/', getQuotes);
router.get('/:id', getQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);
router.post('/:id/send', sendQuote);

export default router;

