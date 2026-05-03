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
        const { productId, quantity } = req.body;

        let cart = await CartModel.findOne({ userId: userId as any });
        if (!cart) {
            cart = new CartModel({ userId: userId as any, items: [], totalAmount: 0 });
        }

        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += (quantity || 1);
        } else {
            cart.items.push({ product: productId, quantity: quantity || 1 } as any);
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
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        let cart = await CartModel.findOne({ userId: userId as any });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.find((item) => item.product.toString() === productId);
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
        const { productId } = req.params;

        let cart = await CartModel.findOne({ userId: userId as any });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Robust filtering to handle both populated and unpopulated product fields
        cart.items = cart.items.filter((item: any) => {
            const itemProdId = item.product?._id ? item.product._id.toString() : item.product?.toString();
            return itemProdId !== productId;
        }) as any;

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
