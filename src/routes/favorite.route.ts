import { Router } from 'express';
import { toggleFavorite, getMyFavorites, checkIsFavorite } from '../controllers/favorite.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

router.use(authGuard);

router.get('/my', getMyFavorites);
router.post('/toggle', toggleFavorite);
router.get('/check/:productId', checkIsFavorite);

export default router;
