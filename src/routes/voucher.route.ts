import { Router } from 'express';
import { createVoucher, getAllVouchers, validateVoucher, deleteVoucher, updateVoucher } from '../controllers/voucher.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Publicly validate
router.post('/validate', authGuard, validateVoucher);

// Admin only
router.get('/', authGuard, isAdmin, getAllVouchers);
router.post('/', authGuard, isAdmin, createVoucher);
router.put('/update/:id', authGuard, isAdmin, updateVoucher);
router.delete('/delete/:id', authGuard, isAdmin, deleteVoucher);

export default router;
