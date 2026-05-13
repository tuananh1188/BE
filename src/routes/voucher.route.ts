import { Router } from 'express';
import { createVoucher, getAllVouchers, validateVoucher, deleteVoucher, updateVoucher, getActiveVouchers, saveVoucher, getMyVouchers } from '../controllers/voucher.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Publicly validate
router.post('/validate', authGuard, validateVoucher);

// Public / User routes
router.get('/active', getActiveVouchers);
router.post('/save/:code', authGuard, saveVoucher);
router.get('/my-vouchers', authGuard, getMyVouchers);

// Admin only
router.get('/', authGuard, isAdmin, getAllVouchers);
router.post('/', authGuard, isAdmin, createVoucher);
router.put('/update/:id', authGuard, isAdmin, updateVoucher);
router.delete('/delete/:id', authGuard, isAdmin, deleteVoucher);

export default router;
