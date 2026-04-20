import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await CategoryModel.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found!' });
        }
        res.json({ success: true, data: category });
    } catch (error: any) {
        res.status(400).json({ success: false, message: 'Invalid Category ID' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const newCategory = await CategoryModel.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Category created successfully!',
            data: newCategory
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found!' });
        }
        res.status(200).json({
            success: true,
            message: 'Category updated successfully!',
            data: updatedCategory
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedCategory = await CategoryModel.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found!' });
        }
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully!'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
