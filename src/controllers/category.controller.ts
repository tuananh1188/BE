import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { uploadImage, deleteImage } from '../services/cloudinary.service';

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
        const { name, description } = req.body;
        let image: string | undefined;

        // Upload image to Cloudinary if file is provided
        if (req.file) {
            const result = await uploadImage(req.file.buffer, 'categories');
            image = result.url;
        }

        const newCategory = await CategoryModel.create({ name, description, image });
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
        const { name, description } = req.body;

        const existing = await CategoryModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Category not found!' });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        // Upload new image if file is provided
        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (existing.image) {
                const parts = existing.image.split('/');
                const filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
                const folder = parts[parts.length - 2];
                await deleteImage(`${folder}/${filename}`).catch(() => {});
            }
            const result = await uploadImage(req.file.buffer, 'categories');
            updateData.image = result.url;
        }

        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

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

        // Clean up image from Cloudinary
        if (deletedCategory.image) {
            const parts = deletedCategory.image.split('/');
            const filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
            const folder = parts[parts.length - 2];
            await deleteImage(`${folder}/${filename}`).catch(() => {});
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully!'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
