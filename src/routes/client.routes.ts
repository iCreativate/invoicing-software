import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller';

const router = Router();

router.use(authenticate);

router.post('/', createClient);
router.get('/', getClients);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;

