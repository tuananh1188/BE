import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        productId: z.string({ required_error: 'Product ID is required' }),
        rating: z.number({ required_error: 'Rating is required' }).min(1).max(5),
        comment: z.string().optional(),
    }),
});
