import { Router } from 'express';
import { handleChat } from '../controllers/chat.controller';

const router = Router();

// Public route for chatbot
router.post('/', handleChat);

export default router;
