import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { UserRole, User } from '../models/user.model';

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, email, displayName, role, photoURL, phoneNumber } = req.body;

    if (!uid) {
      res.status(400).json({ error: 'UID is required' });
      return;
    }

    const result = await UserService.syncUser(uid, {
      email,
      displayName,
      role: role as UserRole,
      photoURL,
      phoneNumber
    });
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Sync user error:', error);
    res.status(500).json({
      error: 'Failed to sync user',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.params.uid as string;
    const user = await UserService.getUser(uid);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const getVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendors = await UserService.getVendors();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get vendors' });
  }
};

export const updateVendorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.params.uid as string;
    await UserService.updateVendorProfile(uid, req.body);
    res.status(200).json({ message: 'Vendor profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vendor profile' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.params.uid as string;
    const { role } = req.body;
    if (!['client', 'vendeur', 'livreur'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    await UserService.updateUserRole(uid, role as UserRole);
    res.status(200).json({ message: `Role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

/**
 * PATCH /users/:uid/driver-location
 * Security checks:
 *  1. auth.uid === uid (own location only)
 *  2. role === livreur
 *  3. Has an active DELIVERING order as driverId
 */
export const updateDriverLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;
    const uid = req.params.uid as string;
    const { latitude, longitude } = req.body;

    // Check 1: Can only update own location
    if (auth.userId !== uid) {
      res.status(403).json({ error: 'Forbidden: You can only update your own location' });
      return;
    }

    // Check 2: Must be a driver
    const user = await UserService.getUser(uid);
    if (!user || user.role !== 'livreur') {
      res.status(403).json({ error: 'Forbidden: Only drivers can update location' });
      return;
    }

    // Check 3: Must have an active DELIVERING order
    const hasActiveDelivery = await UserService.hasActiveDelivery(uid);
    if (!hasActiveDelivery) {
      res.status(403).json({ error: 'Forbidden: No active delivery in progress' });
      return;
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({ error: 'latitude and longitude must be numbers' });
      return;
    }

    const result = await UserService.updateDriverLocation(uid as string, { latitude, longitude });
    if (result.skipped) {
      res.status(200).json({ message: 'Location update skipped (throttled)', reason: result.reason });
    } else {
      res.status(200).json({ message: 'Location updated' });
    }
  } catch (error: any) {
    const code = error.code === 404 ? 404 : 500;
    res.status(code).json({ error: error.message });
  }
};

/**
 * PATCH /users/:uid/driver-availability
 */
export const updateDriverAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;
    const uid = req.params.uid as string;
    const { isAvailable } = req.body;

    if (auth.userId !== uid) {
      res.status(403).json({ error: 'Forbidden: You can only update your own availability' });
      return;
    }

    const user = await UserService.getUser(uid);
    if (!user || user.role !== 'livreur') {
      res.status(403).json({ error: 'Forbidden: Only drivers can update availability' });
      return;
    }

    if (typeof isAvailable !== 'boolean') {
      res.status(400).json({ error: 'isAvailable must be a boolean' });
      return;
    }

    await UserService.updateDriverAvailability(uid as string, isAvailable);
    res.status(200).json({ message: `Availability set to ${isAvailable}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /drivers/:uid/location
 * Used by the client to display driver position on the map.
 */
export const getDriverLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.params.uid as string;
    const location = await UserService.getDriverLocation(uid);
    if (!location) {
      res.status(404).json({ error: 'Driver location not available' });
      return;
    }
    res.status(200).json(location);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
