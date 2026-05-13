import { Request, Response } from 'express';
import { VoucherModel, VoucherType } from '../models/voucher.model';
import { UserModel } from '../models/user.model';

export const createVoucher = async (req: Request, res: Response) => {
    try {
        const voucher = await VoucherModel.create(req.body);
        res.status(201).json({ success: true, data: voucher });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllVouchers = async (req: Request, res: Response) => {
    try {
        const vouchers = await VoucherModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: vouchers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActiveVouchers = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const vouchers = await VoucherModel.find({
            isActive: true,
            expiryDate: { $gt: now },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: vouchers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveVoucher = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        const { code } = req.params;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const voucher = await VoucherModel.findOne({ code: String(code).toUpperCase(), isActive: true });
        if (!voucher) return res.status(404).json({ success: false, message: 'Voucher not found or inactive' });

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.savedVouchers.includes(voucher._id as any)) {
            return res.status(400).json({ success: false, message: 'Voucher already saved' });
        }

        user.savedVouchers.push(voucher._id as any);
        await user.save();

        res.json({ success: true, message: 'Voucher saved successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyVouchers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.sub;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const user = await UserModel.findById(userId).populate('savedVouchers');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: user.savedVouchers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const validateVoucher = async (req: Request, res: Response) => {
    try {
        const { code, orderAmount } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Voucher code is required' });
        }

        const voucher = await VoucherModel.findOne({ code: code.toUpperCase(), isActive: true });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive voucher code' });
        }

        // Check expiry
        if (new Date() > voucher.expiryDate) {
            return res.status(400).json({ success: false, message: 'Voucher has expired' });
        }

        // Check usage limit
        if (voucher.usedCount >= voucher.usageLimit) {
            return res.status(400).json({ success: false, message: 'Voucher usage limit reached' });
        }

        // Check min order amount
        if (orderAmount < voucher.minOrderAmount) {
            return res.status(400).json({ 
                success: false, 
                message: `Minimum order amount for this voucher is $${voucher.minOrderAmount}` 
            });
        }

        // Calculate discount
        let discount = 0;
        if (voucher.type === VoucherType.PERCENTAGE) {
            discount = (orderAmount * voucher.value) / 100;
            if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
                discount = voucher.maxDiscountAmount;
            }
        } else {
            discount = voucher.value;
        }

        res.json({ 
            success: true, 
            discount, 
            voucher: {
                code: voucher.code,
                type: voucher.type,
                value: voucher.value
            }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteVoucher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log('Backend deleting voucher ID:', id);
        const result = await VoucherModel.findByIdAndDelete(id);
        if (!result) {
            console.log('Voucher to delete not found:', id);
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }
        res.json({ success: true, message: 'Voucher deleted' });
    } catch (error: any) {
        console.error('Delete Voucher Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateVoucher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log('Attempting to update voucher ID:', id);
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ success: false, message: 'Invalid Voucher ID' });
        }

        const updates = { ...req.body };
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        delete updates.usedCount;

        const voucher = await VoucherModel.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );

        if (!voucher) {
            console.log('Voucher not found in DB for ID:', id);
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }
        
        console.log('Voucher updated successfully:', voucher.code);
        res.json({ success: true, data: voucher });
    } catch (error: any) {
        console.error('Update Voucher Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};
