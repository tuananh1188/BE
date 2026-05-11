import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        productId: z.string({ error: 'Product ID is required' }),
        rating: z.number({ error: 'Rating is required' }).min(1).max(5),
        comment: z.string().optional(),
    }),
});
