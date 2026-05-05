import { Router } from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:productId', getProductReviews);
router.post('/', authGuard, createReview);

export default router;
