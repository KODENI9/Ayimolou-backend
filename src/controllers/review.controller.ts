import type { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { reviewSchema } from '../schemas/app.schema';

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = reviewSchema.parse(req.body);
    const id = await ReviewService.createReview(validated as any);
    res.status(201).json({ id, message: 'Review created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await ReviewService.getReviews(req.params.targetId as string);
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
