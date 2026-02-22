import { db } from '../config/firebase';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';

// Haversine formula for GPS distance in meters
function getDistanceInMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LOCATION_THROTTLE_MS = 5000; // 5 seconds
const LOCATION_MIN_DISTANCE_M = 10; // 10 meters

export class UserService {
  private static collection = db.collection('users');
  private static ordersCollection = db.collection('orders');

  static async syncUser(uid: string, data: Partial<User>): Promise<{ user: User; isNewUser: boolean }> {
    try {
      const userRef = this.collection.doc(uid);
      const doc = await userRef.get();

      const now = new Date();
      let isNewUser = false;

      const sanitizedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      if (!doc.exists) {
        const newUser: User = {
          uid,
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          displayName: data.displayName || '',
          role: (data.role as UserRole) || 'client',
          status: 'active',
          photoURL: data.photoURL || '',
          createdAt: now,
          updatedAt: now,
        };
        await userRef.set(newUser);
        isNewUser = true;
        return { user: newUser, isNewUser };
      } else {
        await userRef.update({ ...sanitizedData, updatedAt: now });
        const updatedDoc = await userRef.get();
        return { user: updatedDoc.data() as User, isNewUser };
      }
    } catch (error) {
      console.error(`Error in UserService.syncUser for UID ${uid}:`, error);
      throw error;
    }
  }

  static async getUser(uid: string): Promise<User | null> {
    const doc = await this.collection.doc(uid).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  static async getVendors(): Promise<User[]> {
    const snapshot = await this.collection.where('role', '==', 'vendeur').get();
    return snapshot.docs.map((doc) => doc.data() as User);
  }

  static async updateVendorProfile(uid: string, vendorProfile: any): Promise<void> {
    const userRef = this.collection.doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('User not found');

    const existingData = userDoc.data() as User;
    await userRef.update({
      vendorProfile: { ...(existingData.vendorProfile || {}), ...vendorProfile },
      updatedAt: new Date(),
    });
  }

  static async updateUserRole(uid: string, role: UserRole): Promise<void> {
    await this.collection.doc(uid).update({ role, updatedAt: new Date() });
  }

  /**
   * Updates driver GPS location with throttling:
   * - Skips if last update was < 5s ago
   * - Skips if displacement < 10m from last known position
   */
  static async updateDriverLocation(
    uid: string,
    coords: { latitude: number; longitude: number }
  ): Promise<{ skipped: boolean; reason?: string }> {
    const userRef = this.collection.doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw Object.assign(new Error('User not found'), { code: 404 });

    const userData = userDoc.data() as any;
    const lastUpdate = userData.driverProfile?.lastLocationUpdate?.toDate?.() as Date | undefined;
    const lastCoords = userData.driverProfile?.currentLocation;

    // Throttle: skip if updated less than 5s ago
    if (lastUpdate) {
      const elapsedMs = Date.now() - lastUpdate.getTime();
      if (elapsedMs < LOCATION_THROTTLE_MS) {
        return { skipped: true, reason: `Too soon (${Math.round(elapsedMs)}ms since last update)` };
      }
    }

    // Skip if displacement < 10m
    if (lastCoords) {
      const distanceM = getDistanceInMeters(
        lastCoords.latitude, lastCoords.longitude,
        coords.latitude, coords.longitude
      );
      if (distanceM < LOCATION_MIN_DISTANCE_M) {
        return { skipped: true, reason: `Too close (${Math.round(distanceM)}m)` };
      }
    }

    await userRef.update({
      'driverProfile.currentLocation': coords,
      'driverProfile.lastLocationUpdate': new Date(),
      updatedAt: new Date(),
    });

    // Check proximity notification
    this.checkProximityNotifications(uid, coords).catch(console.error);

    return { skipped: false };
  }

  private static async checkProximityNotifications(driverId: string, driverCoords: { latitude: number; longitude: number }) {
    const activeOrdersSnapshot = await this.ordersCollection
      .where('driverId', '==', driverId)
      .where('status', '==', 'DELIVERING')
      .get();

    for (const doc of activeOrdersSnapshot.docs) {
      const order = doc.data() as any;
      if (order.nearbyNotified) continue;

      const deliveryCoords = order.deliveryAddress?.coordinates;
      if (!deliveryCoords) continue;

      const distanceToClient = getDistanceInMeters(
        driverCoords.latitude, driverCoords.longitude,
        deliveryCoords.latitude, deliveryCoords.longitude
      );

      // Notify if within 500 meters
      if (distanceToClient < 500) {
        await this.ordersCollection.doc(doc.id).update({ nearbyNotified: true });
        NotificationService.notifyNearby(order.clientId, doc.id).catch(console.error);
      }
    }
  }

  static async updateDriverAvailability(uid: string, isAvailable: boolean): Promise<void> {
    await this.collection.doc(uid).update({
      'driverProfile.isAvailable': isAvailable,
      updatedAt: new Date(),
    });
  }

  static async getDriverLocation(uid: string): Promise<{ latitude: number; longitude: number } | null> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data() as any;
    return data.driverProfile?.currentLocation || null;
  }

  /**
   * Verifies that the given uid has an active DELIVERING order as driver.
   * Used to guard the GPS update endpoint.
   */
  static async hasActiveDelivery(uid: string): Promise<boolean> {
    const snapshot = await this.ordersCollection
      .where('driverId', '==', uid)
      .where('status', '==', 'DELIVERING')
      .limit(1)
      .get();
    return !snapshot.empty;
  }
}
