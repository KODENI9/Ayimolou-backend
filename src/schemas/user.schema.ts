import { z } from 'zod';

export const syncUserSchema = z.object({
  body: z.object({
    uid: z.string().min(1, 'UID is required'),
    email: z.string().email('Invalid email address').optional(),
    displayName: z.string().optional(),
    role: z.enum(['client', 'vendeur', 'livreur', 'admin']).default('client'),
    photoURL: z.string().url('Invalid photo URL').optional().or(z.literal('')),
    phoneNumber: z.string().optional(),
  }),
});

export type SyncUserBody = z.infer<typeof syncUserSchema>['body'];
