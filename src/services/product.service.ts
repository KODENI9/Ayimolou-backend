import { db } from '../config/firebase';
import { Product } from '../models/product.model';

export class ProductService {
  private static collection = db.collection('products');

  static async createProduct(data: Product): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  static async getProducts(filters?: { vendorId?: string | undefined; categoryId?: string | undefined, isAvailable?: boolean | undefined }): Promise<Product[]> {
    let query: any = this.collection;

    if (filters?.vendorId) {
      query = query.where('vendorId', '==', filters.vendorId);
    }
    if (filters?.categoryId) {
      query = query.where('categoryId', '==', filters.categoryId);
    }
    if (filters?.isAvailable !== undefined) {
      query = query.where('isAvailable', '==', filters.isAvailable);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  static async getProduct(id: string): Promise<Product | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Product : null;
  }

  static async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await this.collection.doc(id).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  static async deleteProduct(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
