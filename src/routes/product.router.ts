import { Router } from 'express';
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct
} from '../controllers/product.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const productRouter = Router();
//Public router
productRouter.get('/', getAllProducts);
productRouter.get('/:id', getProductById);

//Private router
productRouter.post('/', authGuard, isAdmin, validateBody(createProductSchema), createProduct);
productRouter.put('/:id', authGuard, isAdmin, validateBody(updateProductSchema), updateProduct);
productRouter.delete('/:id', authGuard, isAdmin, deleteProduct);

export default productRouter;
