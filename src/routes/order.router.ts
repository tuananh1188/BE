import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import {
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    getDashboardStats
} from '../controllers/order.controller';

const orderRouter = Router();

// All routes require authentication
orderRouter.use(authGuard);

// Admin routes
orderRouter.get('/all', isAdmin, getAllOrders);
orderRouter.get('/stats', isAdmin, getDashboardStats);

// User routes
orderRouter.post('/checkout', createOrder);
orderRouter.get('/my-orders', getUserOrders);
orderRouter.get('/:id', getOrderById);
orderRouter.put('/:id', isAdmin, updateOrderStatus);

export default orderRouter;
