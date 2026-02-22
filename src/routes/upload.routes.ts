import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import upload from '../middlewares/upload.middleware';

const router = Router();

// Secure signed upload route (it is secure because the backend uses the API secret)
router.post('/image', upload.single('image'), uploadImage);

export default router;
