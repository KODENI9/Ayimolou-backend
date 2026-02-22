import { db } from '../config/firebase';
import { Order, OrderStatus } from '../models/order.model';
import { NotificationService } from './notification.service';

export class OrderService {
  private static collection = db.collection('orders');

  static async createOrder(data: Order): Promise<string> {
    const docRef = await this.collection.add({
      ...data,
      status: 'PENDING',
      paymentStatus: data.paymentStatus || 'UNPAID',
      driverId: null, // explicitly null for Firestore queries
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    NotificationService.notifyNewOrder(data.vendorId, docRef.id).catch(err => {
      console.error('Failed to notify vendor:', err);
    });

    return docRef.id;
  }

  static async getOrders(filters: {
    clientId?: string;
    vendorId?: string;
    driverId?: string;
    status?: string;
  }): Promise<Order[]> {
    let query: any = this.collection;

    if (filters.clientId) query = query.where('clientId', '==', filters.clientId);
    if (filters.vendorId) query = query.where('vendorId', '==', filters.vendorId);
    if (filters.driverId) query = query.where('driverId', '==', filters.driverId);
    if (filters.status)   query = query.where('status', '==', filters.status);

    query = query.orderBy('createdAt', 'desc');

    try {
      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
      if (error.message.includes('FAILED_PRECONDITION')) {
        console.error('Missing Firestore Index:', error.message.split('here: ')[1]);
      }
      // Fallback in-memory sort (dev only)
      const rawSnapshot = await this.collection.get();
      const orders = rawSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return orders.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    }
  }

  /**
   * Returns READY orders without an assigned driver.
   * Strict filter: status === READY + driverId === null + deliveryType === DELIVERY
   */
  static async getAvailableDeliveries(): Promise<Order[]> {
    try {
      const snapshot = await this.collection
        .where('status', '==', 'READY')
        .where('driverId', '==', null)
        .orderBy('createdAt', 'asc')
        .get();

      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
      // Fallback if index missing
      const rawSnapshot = await this.collection
        .where('status', '==', 'READY')
        .get();
      const all = rawSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return all.filter((o: any) => !o.driverId);
    }
  }

  /**
   * ATOMIC assignment: a Firestore transaction ensures only one driver
   * can win the race. Returns 409 conflict if already taken.
   */
  static async assignDriver(orderId: string, driverId: string): Promise<void> {
    const orderRef = this.collection.doc(orderId);

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw Object.assign(new Error('Order not found'), { code: 404 });

      const order = snapshot.data() as Order;

      if (order.status !== 'READY') {
        throw Object.assign(new Error('Order is not available for delivery'), { code: 409 });
      }
      if (order.driverId != null) {
        throw Object.assign(new Error('Order already taken by another driver'), { code: 409 });
      }

      // Atomic write inside transaction
      transaction.update(orderRef, {
        driverId,
        status: 'DELIVERING' as OrderStatus,
        updatedAt: new Date(),
      });
    });

    // Notify client
    const order = await this.getOrder(orderId);
    if (order) {
      NotificationService.notifyStatusUpdate(order.clientId, orderId, 'DELIVERING').catch(console.error);
    }
  }

  /**
   * Only the assigned driver can mark an order as COMPLETED.
   */
  static async completeDelivery(orderId: string, driverId: string): Promise<void> {
    const order = await this.getOrder(orderId);
    if (!order) throw Object.assign(new Error('Order not found'), { code: 404 });
    if (order.driverId !== driverId) throw Object.assign(new Error('Forbidden'), { code: 403 });
    if (order.status !== 'DELIVERING') throw Object.assign(new Error('Order is not in DELIVERING status'), { code: 409 });

    await this.collection.doc(orderId).update({
      status: 'COMPLETED' as OrderStatus,
      updatedAt: new Date(),
    });

    NotificationService.notifyStatusUpdate(order.clientId, orderId, 'COMPLETED').catch(console.error);
  }

  /**
   * Role-based status transitions matrix.
   * Vendor: PENDING→ACCEPTED, PENDING→CANCELLED, ACCEPTED→PREPARING, PREPARING→READY
   * Driver: (handled separately via assignDriver/completeDelivery, not this function)
   */
  static async updateOrderStatus(id: string, status: OrderStatus, actorId: string, actorRole: 'vendeur' | 'livreur'): Promise<void> {
    const orderDoc = await this.collection.doc(id).get();
    if (!orderDoc.exists) throw Object.assign(new Error('Order not found'), { code: 404 });

    const orderData = orderDoc.data() as Order;

    // Vendor transition matrix
    const vendorTransitions: Record<string, OrderStatus[]> = {
      PENDING:  ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PREPARING'],
      PREPARING: ['READY'],
    };

    if (actorRole === 'vendeur') {
      if (orderData.vendorId !== actorId) throw Object.assign(new Error('Forbidden'), { code: 403 });
      const allowed = vendorTransitions[orderData.status] || [];
      if (!allowed.includes(status)) {
        throw Object.assign(new Error(`Transition ${orderData.status} → ${status} not allowed for vendor`), { code: 422 });
      }
    } else {
      // Drivers use assignDriver / completeDelivery
      throw Object.assign(new Error('Drivers must use /assign or /complete endpoints'), { code: 403 });
    }

    await this.collection.doc(id).update({ status, updatedAt: new Date() });
    NotificationService.notifyStatusUpdate(orderData.clientId, id, status).catch(console.error);
  }

  static async updatePaymentStatus(id: string, paymentStatus: 'PAID' | 'UNPAID' | 'REFUNDED'): Promise<void> {
    await this.collection.doc(id).update({ paymentStatus, updatedAt: new Date() });
  }

  static async getOrder(id: string): Promise<Order | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Order : null;
  }
}
