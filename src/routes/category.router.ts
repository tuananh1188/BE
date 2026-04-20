import { Router } from 'express';
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    updateCategory
} from '../controllers/category.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

const categoryRouter = Router();

// Public routes
categoryRouter.get('/', getAllCategories);
categoryRouter.get('/:id', getCategoryById);

// Admin routes
categoryRouter.post('/', authGuard, isAdmin, createCategory);
categoryRouter.put('/:id', authGuard, isAdmin, updateCategory);
categoryRouter.delete('/:id', authGuard, isAdmin, deleteCategory);

export default categoryRouter;
