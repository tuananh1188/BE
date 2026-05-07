import { Request, Response } from 'express';
import { OrderModel } from '../models/order.model';
import { CartModel } from '../models/cart.model';
import { ProductModel } from '../models/product.model';
import { UserModel } from '../models/user.model';
import { VoucherModel } from '../models/voucher.model';

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { shippingAddress, paymentMethod, promoCode } = req.body;

        // Get user's cart
        const cart = await CartModel.findOne({ userId: userId as any }).populate({
            path: 'items.product',
            select: 'name price originalPrice images stock'
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Validate stock and prepare order items (snapshot)
        const orderItems = [];
        let subtotal = 0;

        for (const item of cart.items) {
            const product = item.product as any;
            
            if (!product) {
                 return res.status(400).json({ success: false, message: 'Product in cart no longer exists' });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Not enough stock for ${product.name}. Available: ${product.stock}` 
                });
            }

            const itemPrice = product.price || product.originalPrice;
            subtotal += itemPrice * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.images[0] || '',
                price: itemPrice,
                quantity: item.quantity
            });
        }

        const shippingFee = 0; // Free shipping for now
        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        let totalAmount = subtotal + shippingFee + tax;
        let discountAmount = 0;

        // Apply Voucher if exists
        if (promoCode) {
            const voucher = await VoucherModel.findOne({ code: promoCode, isActive: true });
            if (voucher) {
                // Validate expiry
                if (new Date(voucher.expiryDate) > new Date() && voucher.usedCount < voucher.usageLimit && totalAmount >= voucher.minOrderAmount) {
                    if (voucher.type === 'fixed') {
                        discountAmount = voucher.value;
                    } else {
                        discountAmount = (totalAmount * voucher.value) / 100;
                        if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
                            discountAmount = voucher.maxDiscountAmount;
                        }
                    }
                    totalAmount = Math.max(0, totalAmount - discountAmount);
                    
                    // Increment voucher usage
                    voucher.usedCount += 1;
                    await voucher.save();
                }
            }
        }

        // Create the order
        const newOrder = await OrderModel.create({
            userId: userId as any,
            items: orderItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING',
            subtotal,
            shippingFee,
            tax,
            totalAmount,
            promoCode
        });

        // Deduct stock for products and update totalSold
        for (const item of orderItems) {
            const product = await ProductModel.findById(item.product);
            if (product) {
                product.stock -= item.quantity;
                product.totalSold = (product.totalSold || 0) + item.quantity;
                await product.save();
            }
        }

        // Clear the user's cart
        cart.items = [] as any;
        cart.totalAmount = 0;
        await cart.save();

        res.status(201).json({ success: true, message: 'Order created successfully', data: newOrder });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const orders = await OrderModel.find({ userId: userId as any }).sort({ createdAt: -1 });
        
        res.json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findById(id).populate('userId', 'email displayName');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the user is the owner or an admin
        if ((order.userId as any)._id.toString() !== (req as any).user?.sub && (req as any).user?.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        res.json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
};

// Admin Routes
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await OrderModel.find()
            .populate('userId', 'email displayName')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { orderStatus, paymentStatus } = req.body;

        const updateData: any = {};
        if (orderStatus) updateData.orderStatus = orderStatus;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;

        const order = await OrderModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order status updated', data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    console.log('--- Dashboard Stats Request Start ---');
    try {
        console.log('Counting orders...');
        const totalOrders = await OrderModel.countDocuments();
        
        console.log('Counting users...');
        const totalUsers = await UserModel.countDocuments();
        
        console.log('Calculating revenue...');
        const revenueResult = await OrderModel.aggregate([
            { $match: { paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        console.log('Fetching recent orders...');
        const recentOrders = await OrderModel.find()
            .populate('userId', 'email displayName')
            .sort({ createdAt: -1 })
            .limit(5);

        console.log('Stats calculation successful');
        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                totalUsers,
                recentOrders
            }
        });
    } catch (error: any) {
        console.error('CRITICAL Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        console.log('--- Dashboard Stats Request End ---');
    }
};
