import { z } from 'zod';
export const createProductSchema = z.object({
    name: z.string().trim().min(3, 'Name is required!'),
    description: z.string().min(10, 'Description is required !'),
    price: z.number().min(0, 'The price must not be less than 0. !'),
    category: z.string().min(1, 'Category is required !  '),
    images: z
        .array(z.string().url('Invalid image link !'))
        .min(1, 'image is required !')
        .default([]),
    stock: z.number().int().min(0).default(0),
    rating: z.number().min(0).max(5).optional().default(0)
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
    id: z
        .string()
        .regex(
            /^[0-9a-fA-F]{24}$/,
            'The ID is not in the correct MongoDB format !'
        )
});
