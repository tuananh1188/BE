import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { createReview, getProductReviews, toggleHelpful, replyReview, uploadReviewMedia } from '../controllers/review.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

const upload = multer({
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.get('/:productId', getProductReviews);
router.post('/', authGuard, createReview);
router.post('/media', authGuard, upload.array('files', 5), uploadReviewMedia);
router.patch('/:id/helpful', authGuard, toggleHelpful);
router.patch('/:id/reply', authGuard, isAdmin, replyReview);

export default router;
