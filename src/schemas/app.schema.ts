import { z } from 'zod';

export const productSchema = z.object({
  vendorId: z.string(),
  categoryId: z.string(),
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  options: z.array(z.object({
    name: z.string(),
    price: z.number().optional(),
  })).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  iconUrl: z.string().url().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  options: z.array(z.object({
    name: z.string(),
    price: z.number().optional(),
  })).optional(),
});

export const orderSchema = z.object({
  clientId: z.string(),
  vendorId: z.string(),
  items: z.array(orderItemSchema).min(1),
  totalPrice: z.number().positive(),
  deliveryAddress: z.object({
    address: z.string().min(5),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY']).default('CASH'),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).default('UNPAID'),
  notes: z.string().optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING' , 'COMPLETED', 'CANCELLED']),
});

export const reviewSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  targetId: z.string(),
  targetType: z.enum(['vendor', 'product']),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});
