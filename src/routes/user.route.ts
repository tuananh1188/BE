import { Router } from 'express';
import { getAllUsers, updateUserRole } from '../controllers/user.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

export const userRouter = Router();

userRouter.use(authGuard);
userRouter.use(isAdmin);

userRouter.get('/', getAllUsers);
userRouter.patch('/:id/role', updateUserRole);
