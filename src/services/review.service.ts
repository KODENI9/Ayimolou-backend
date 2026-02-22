import { db } from '../config/firebase';
import { Review } from '../models/review.model';

export class ReviewService {
  private static collection = db.collection('reviews');

  static async createReview(data: Review): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  static async getReviews(targetId: string): Promise<Review[]> {
    const snapshot = await this.collection.where('targetId', '==', targetId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }
}
