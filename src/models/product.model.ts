export interface Product {
  id?: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  options?: ProductOption[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductOption {
  name: string;
  price?: number;
}
