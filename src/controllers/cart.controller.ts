import { Request, Response } from 'express';
import { CartModel } from '../models/cart.model';

// Helper to calculate total amount
const calculateTotal = async (cart: any) => {
    let total = 0;
    for (const item of cart.items) {
        if (item.product && (item.product.price || item.product.originalPrice)) {
            const price = item.product.price || item.product.originalPrice;
            total += price * item.quantity;
        }
    }
    return total;
};

export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        let cart = await CartModel.findOne({ userId: userId as any }).populate({
            path: 'items.product',
            select: 'name price originalPrice images stock category discount'
        });

        if (!cart) {
            cart = await CartModel.create({ userId: userId as any, items: [], totalAmount: 0 });
        } else {
            // Recalculate total just in case prices changed
            cart.totalAmount = await calculateTotal(cart);
            await cart.save();
        }

        res.json({ success: true, data: cart });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId, quantity, size, color } = req.body;

        let cart = await CartModel.findOne({ userId: userId as any });
        if (!cart) {
            cart = new CartModel({ userId: userId as any, items: [], totalAmount: 0 });
        }

        // Tìm item có cùng productId, cùng size và cùng color
        const existingItemIndex = cart.items.findIndex(
            (item) => 
                item.product.toString() === productId && 
                item.size === size && 
                item.color === color
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += (quantity || 1);
        } else {
            cart.items.push({ 
                product: productId as any, 
                quantity: quantity || 1,
                size,
                color
            } as any);
        }

        await cart.save();
        
        // Populate to return the full cart state
        const populatedCart = await CartModel.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price originalPrice images stock category discount'
        });
        
        if (populatedCart) {
            populatedCart.totalAmount = await calculateTotal(populatedCart);
            await populatedCart.save();
        }

        res.json({ success: true, data: populatedCart });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { itemId } = req.params; // Chuyển từ productId sang itemId
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        let cart = await CartModel.findOne({ userId: userId as any });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Tìm đúng item dựa trên _id của nó trong mảng items
        const item = cart.items.find((item) => item._id?.toString() === itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        item.quantity = quantity;
        await cart.save();

        const populatedCart = await CartModel.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price originalPrice images stock category discount'
        });

        if (populatedCart) {
            populatedCart.totalAmount = await calculateTotal(populatedCart);
            await populatedCart.save();
        }

        res.json({ success: true, data: populatedCart });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const removeCartItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { itemId } = req.params;

        let cart = await CartModel.findOne({ userId: userId as any });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Lọc bỏ item dựa trên _id của item
        cart.items = cart.items.filter((item: any) => item._id?.toString() !== itemId) as any;

        await cart.save();

        const populatedCart = await CartModel.findById(cart._id).populate({
            path: 'items.product',
            select: 'name price originalPrice images stock category discount'
        });

        if (populatedCart) {
            populatedCart.totalAmount = await calculateTotal(populatedCart);
            await populatedCart.save();
        }

        res.json({ success: true, data: populatedCart });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const clearCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        let cart = await CartModel.findOne({ userId: userId as any });
        
        if (cart) {
            cart.items = [] as any;
            cart.totalAmount = 0;
            await cart.save();
        }

        res.json({ success: true, message: 'Cart cleared', data: cart });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
