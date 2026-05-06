import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} from '../controllers/cart.controller';

const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authGuard);

cartRouter.get('/', getCart);
cartRouter.post('/add', addToCart);
cartRouter.put('/update/:itemId', updateCartItem);
cartRouter.delete('/remove/:itemId', removeCartItem);
cartRouter.delete('/clear', clearCart);

export default cartRouter;
