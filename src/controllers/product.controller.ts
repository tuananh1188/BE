import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';


export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const { search, category } = req.query;
        let query: any = {};

        if (search) {
            query.$text = { $search: search as string, $optional: 'i' };
        }

        if (category) {
            query.category = category;
        }

        const products = await ProductModel.find(query).populate('category').sort({ createdAt: -1 });
        res.json({
            success: true,
            count: products.length,
            data: products
        })

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })

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

export const createProduct = async (req: Request, res: Response) => {
    try {
        const newProduct = await ProductModel.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Create product successfully !',
            data: newProduct
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            req.body,
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
