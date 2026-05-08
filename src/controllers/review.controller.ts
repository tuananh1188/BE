import { Request, Response } from 'express';
import { ReviewModel } from '../models/review.model';
import { ProductModel } from '../models/product.model';
import { OrderModel } from '../models/order.model';
import { uploadImage } from '../services/cloudinary.service';
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
        const numRating = Number(rating || 0);
        if (isNaN(numRating) || numRating < 0 || numRating > 5) {
            return res.status(400).json({ success: false, message: 'Đánh giá phải là số từ 0 đến 5' });
        }

        // Check if user already rated this product (if they are providing a rating > 0)

        if (numRating > 0) {
            const existingRating = await ReviewModel.findOne({ 
                user: new mongoose.Types.ObjectId(userId), 
                product: new mongoose.Types.ObjectId(productId),
                rating: { $gt: 0 }
            });
            if (existingRating) {
                return res.status(400).json({ success: false, message: 'Bạn đã đánh giá số sao cho sản phẩm này rồi. Bạn chỉ có thể gửi thêm bình luận.' });
            }
        } else if (!comment || comment.trim() === '') {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập bình luận hoặc đánh giá số sao.' });
        }

        // 4. Check for Verified Purchase
        const verifiedOrder = await OrderModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            'items.product': new mongoose.Types.ObjectId(productId),
            orderStatus: 'DELIVERED'
        });

        const isVerifiedPurchase = !!verifiedOrder;

        // Create new review/comment
        const review = await ReviewModel.create({
            user: new mongoose.Types.ObjectId(userId),
            product: new mongoose.Types.ObjectId(productId),
            rating: numRating,
            comment: comment || '',
            images: req.body.images || [],
            isVerifiedPurchase
        });

        // Recalculate average rating for the product (only from reviews with rating > 0)
        const ratingReviews = await ReviewModel.find({ 
            product: new mongoose.Types.ObjectId(productId),
            rating: { $gt: 0 }
        });
        
        const numRatings = ratingReviews.length;
        const totalRating = ratingReviews.reduce((acc, item) => acc + item.rating, 0);
        const avgRating = numRatings > 0 ? totalRating / numRatings : 0;

        // Update product
        await ProductModel.findByIdAndUpdate(productId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: numRatings
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

export const toggleHelpful = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.sub;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const review = await ReviewModel.findById(id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const index = review.helpfulVotes.indexOf(userObjectId);

        if (index > -1) {
            review.helpfulVotes.splice(index, 1);
        } else {
            review.helpfulVotes.push(userObjectId);
        }

        await review.save();

        res.json({ success: true, helpfulVotes: review.helpfulVotes.length, data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const replyReview = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        const review = await ReviewModel.findByIdAndUpdate(
            id,
            { adminReply: reply },
            { new: true }
        ).populate('user', 'displayName avatarUrl');

        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        res.json({ success: true, message: 'Đã phản hồi đánh giá', data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadReviewMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files provided' });
        }

        const uploadPromises = files.map(file => uploadImage(file.buffer, 'reviews'));
        const results = await Promise.all(uploadPromises);
        const urls = results.map(r => r.url);

        res.json({ success: true, urls });
    } catch (error: any) {
        console.error("Upload Review Media Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
