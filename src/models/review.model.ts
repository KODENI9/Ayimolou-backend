export interface Review {
  id?: string;
  userId: string;
  userName: string;
  targetId: string; // Vendor ID or Product ID
  targetType: 'vendor' | 'product';
  rating: number; // 1 to 5
  comment?: string;
  createdAt: Date | string;
}
