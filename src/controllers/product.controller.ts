import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';


export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const { search, category, minPrice, maxPrice, sort } = req.query;
        let query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search as string, $options: 'i' } },
                { description: { $regex: search as string, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortQuery: any = { createdAt: -1 };
        if (sort) {
            if (sort === 'price-asc') sortQuery = { price: 1 };
            else if (sort === 'price-desc') sortQuery = { price: -1 };
            else if (sort === 'newest') sortQuery = { createdAt: -1 };
            else if (sort === 'sold') sortQuery = { totalSold: -1 };
        }

        const products = await ProductModel.find(query).populate('category').sort(sortQuery);
        res.json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id).populate('category');

        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found !' });
        res.json({ success: true, data: product });

    } catch (error: any) {
        res.status(400).json({ success: false, message: ' Invalid Product ID' })

    }

};

import { uploadToCloudinary } from '../utils/cloudinary.util';

export const createProduct = async (req: Request, res: Response) => {
    try {
        let images = req.body.images || [];

        // Nếu có file upload, upload lên Cloudinary và lấy URL
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
                uploadToCloudinary(file.buffer)
            );
            const uploadedUrls = await Promise.all(uploadPromises);
            images = [...images, ...uploadedUrls];
        }

        const productData = {
            ...req.body,
            images
        };

        const newProduct = await ProductModel.create(productData);
        res.status(201).json({
            success: true,
            message: 'Create product successfully !',
            data: newProduct
        });
    } catch (error: any) {
        console.error("Create Product Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let images = req.body.images;

        // Nếu images là chuỗi (đến từ form-data nếu chỉ có 1 URL), chuyển thành mảng
        if (typeof images === 'string') {
            images = [images];
        }

        // Nếu có file upload mới
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
                uploadToCloudinary(file.buffer)
            );
            const uploadedUrls = await Promise.all(uploadPromises);
            
            // Nếu req.body.images tồn tại (giữ các ảnh cũ), thì gộp lại. 
            // Nếu không thì chỉ dùng ảnh mới.
            images = [...(images || []), ...uploadedUrls];
        }

        const updateData = {
            ...req.body,
            ...(images && { images })
        };

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found!'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Update product successfully !',
            data: updatedProduct
        });
    } catch (error: any) {
        console.error("Update Product Error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedProduct = await ProductModel.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found !'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Delete product successfully !'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
