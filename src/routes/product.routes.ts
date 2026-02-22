import { Router } from 'express';
import { createProduct, getProducts, getProductDetails, updateProduct, deleteProduct } from '../controllers/product.controller';
import { requireAuth } from '../middlewares/clerk';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductDetails);
router.post('/', requireAuth, createProduct);
router.patch('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

export default router;
