import { Request, Response } from 'express';
import { FavoriteModel } from '../models/favorite.model';
import { ProductModel } from '../models/product.model';

export const toggleFavorite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const existing = await FavoriteModel.findOne({ userId, productId });

        if (existing) {
            await FavoriteModel.deleteOne({ _id: existing._id });
            return res.json({ success: true, message: 'Removed from favorites', isFavorite: false });
        } else {
            await FavoriteModel.create({ userId, productId });
            return res.status(201).json({ success: true, message: 'Added to favorites', isFavorite: true });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyFavorites = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        const favorites = await FavoriteModel.find({ userId }).populate('productId');
        
        // Filter out favorites where product might have been deleted
        const validFavorites = favorites.filter(f => f.productId);
        const products = validFavorites.map(f => f.productId);

        res.json({ success: true, count: products.length, data: products });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkIsFavorite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        const { productId } = req.params;

        const existing = await FavoriteModel.findOne({ userId, productId });
        res.json({ success: true, isFavorite: !!existing });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
