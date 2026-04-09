import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { trusted } from 'mongoose';
import { success } from 'zod';

export const getAllProducts = async (req: Request, res: Response) => {
    const { search } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const products = await ProductModel.find(query as any);
    res.json(products);
};

export const getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product)
        return res.status(404).json({ message: 'Product not found !' });
    res.json(product);
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
