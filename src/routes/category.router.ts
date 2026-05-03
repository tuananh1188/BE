import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
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

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

// Public routes
categoryRouter.get('/', getAllCategories);
categoryRouter.get('/:id', getCategoryById);

// Admin routes (with file upload)
categoryRouter.post('/', authGuard, isAdmin, upload.single('image'), createCategory);
categoryRouter.put('/:id', authGuard, isAdmin, upload.single('image'), updateCategory);
categoryRouter.delete('/:id', authGuard, isAdmin, deleteCategory);

export default categoryRouter;
