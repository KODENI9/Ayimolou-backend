import { db } from '../config/firebase';
import { Category } from '../models/category.model';

export class CategoryService {
  private static collection = db.collection('categories');

  static async getCategories(): Promise<Category[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  static async createCategory(data: Category): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  }
}
