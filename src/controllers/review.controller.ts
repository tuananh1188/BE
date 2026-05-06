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

        // Validate productId
        if (!productId || typeof productId !== 'string' || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        // Validate rating
        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: 'Đánh giá phải là số từ 1 đến 5' });
        }

        // Check if product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        // Check if user already reviewed this product
        const existingReview = await ReviewModel.findOne({ 
            user: new mongoose.Types.ObjectId(userId), 
            product: new mongoose.Types.ObjectId(productId) 
        });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }

        // Create new review
        const review = await ReviewModel.create({
            user: new mongoose.Types.ObjectId(userId),
            product: new mongoose.Types.ObjectId(productId),
            rating: numRating,
            comment: comment || ''
        });

        // Recalculate average rating for the product
        const reviews = await ReviewModel.find({ product: new mongoose.Types.ObjectId(productId) });
        const numReviews = reviews.length;
        const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
        const avgRating = totalRating / numReviews;

        // Update product
        await ProductModel.findByIdAndUpdate(productId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: numReviews
        });

        // Populate user for response
        await review.populate('user', 'displayName avatarUrl');

        res.status(201).json({
            success: true,
            message: 'Đánh giá sản phẩm thành công!',
            data: review
        });
    } catch (error: any) {
        console.error("Create Review Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi hệ thống khi tạo đánh giá' });
    }
};

export const getProductReviews = async (req: Request, res: Response): Promise<any> => {
    try {
        const { productId } = req.params;

        if (!productId || typeof productId !== 'string' || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        const reviews = await ReviewModel.find({ product: new mongoose.Types.ObjectId(productId) })
            .populate('user', 'displayName avatarUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error: any) {
        console.error("Get Product Reviews Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi hệ thống khi lấy danh sách đánh giá' });
    }
};
