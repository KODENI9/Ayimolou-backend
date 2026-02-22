import type { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { productSchema } from '../schemas/app.schema';

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = productSchema.parse(req.body);
    const { auth } = req as any;

    // Security: Ensure the vendor is creating a product for themselves
    if (validated.vendorId !== auth.userId) {
      res.status(403).json({ error: 'Forbidden: You can only create products for yourself' });
      return;
    }

    const id = await ProductService.createProduct(validated as any);
    res.status(201).json({ id, message: 'Product created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId = req.query.vendorId as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const { auth } = req as any;

    // Default filtering: only show available products to everyone
    // EXCEPT when a vendor is looking at their own products
    let isAvailable: boolean | undefined = true;
    
    if (auth && vendorId === auth.userId) {
      isAvailable = undefined; // Show all (available and out of stock) to the vendor
    }

    const products = await ProductService.getProducts({ 
      vendorId, 
      categoryId,
      isAvailable
    });
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getProduct(req.params.id as string);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(200).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { auth } = req as any;

    // Security: Check ownership
    const product = await ProductService.getProduct(id as string);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.vendorId !== auth.userId) {
      res.status(403).json({ error: 'Forbidden: You can only update your own products' });
      return;
    }

    await ProductService.updateProduct(id as string, req.body);
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { auth } = req as any;

    // Security: Check ownership
    const product = await ProductService.getProduct(id as string);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.vendorId !== auth.userId) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own products' });
      return;
    }

    await ProductService.deleteProduct(id as string);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
