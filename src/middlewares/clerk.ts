import { clerkClient } from '@clerk/express';
import { NextFunction, Request, Response } from 'express';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { auth } = req as any;

  if (!auth?.userId) {
    return res.status(401).json({ error: 'Unauthorized: No session found' });
  }

  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { auth } = req as any;

  if (!auth.userId) {
    return res.status(401).json({ error: 'Unauthorized: No session found' });
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    if (user.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
