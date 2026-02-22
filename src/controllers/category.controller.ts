 import type { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { categorySchema } from '../schemas/app.schema';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryService.getCategories();
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = categorySchema.parse(req.body);
    const id = await CategoryService.createCategory(validated as any);
    res.status(201).json({ id, message: 'Category created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
