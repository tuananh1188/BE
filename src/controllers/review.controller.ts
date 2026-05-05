import { Request, Response } from 'express';
import { ReviewModel } from '../models/review.model';
import { ProductModel } from '../models/product.model';
import mongoose from 'mongoose';

export const createReview = async (req: Request, res: Response): Promise<any> => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = (req as any).user?.sub;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Check if user already reviewed this product
        const existingReview = await ReviewModel.findOne({ user: userId, product: productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
        }

        // Create new review
        const review = await ReviewModel.create({
            user: userId,
            product: productId,
            rating,
            comment
        });

        // Recalculate average rating for the product
        const reviews = await ReviewModel.find({ product: productId });
        const numReviews = reviews.length;
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

        // Update product
        await ProductModel.findByIdAndUpdate(productId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: numReviews
        });

        // Populate user for response
        await review.populate('user', 'displayName avatarUrl');

        res.status(201).json({
            success: true,
            message: 'Review created successfully!',
            data: review
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductReviews = async (req: Request, res: Response): Promise<any> => {
    try {
        const { productId } = req.params;
        
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const reviews = await ReviewModel.find({ product: productId })
            .populate('user', 'displayName avatarUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
