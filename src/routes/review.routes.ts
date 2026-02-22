import { Router } from 'express';
import { createReview, getReviews } from '../controllers/review.controller';

const router = Router();

router.get('/:targetId', getReviews);
router.post('/', createReview);

export default router;
