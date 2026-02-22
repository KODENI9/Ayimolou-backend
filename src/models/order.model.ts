import { Product } from './product.model';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface Order {
  id?: string;
  clientId: string;
  vendorId: string;
  driverId?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: 'CASH' | 'MOBILE_MONEY';
  paymentStatus: PaymentStatus;
  deliveryAddress: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes?: string;
  nearbyNotified?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: { name: string; price?: number }[];
}
