import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  convertQuoteToInvoice,
  getInvoiceStats,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/stats', getInvoiceStats);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/send', sendInvoice);
router.post('/quote/:quoteId/convert', convertQuoteToInvoice);

export default router;

