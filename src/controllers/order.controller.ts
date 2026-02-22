import type { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';
import { UserService } from '../services/user.service';
import { orderSchema } from '../schemas/app.schema';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = orderSchema.parse(req.body);
    const { auth } = req as any;

    if (validated.clientId !== auth.userId) {
      res.status(403).json({ error: 'Forbidden: You can only create orders for yourself' });
      return;
    }

    const id = await OrderService.createOrder(validated as any);
    res.status(201).json({ id, message: 'Order created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.query;
    const { auth } = req as any;

    if (clientId && clientId !== auth.userId) {
      res.status(403).json({ error: 'Forbidden: You can only view your own orders' });
      return;
    }

    const targetClientId = (clientId as string) || auth.userId;
    const orders = await OrderService.getOrders({ clientId: targetClientId });
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;
    const orders = await OrderService.getOrders({ vendorId: auth.userId });
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDriverOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;
    const orders = await OrderService.getOrders({ driverId: auth.userId });
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Only drivers with isAvailable === true can see available deliveries.
 * Checked server-side, not just frontend.
 */
export const getAvailableDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;

    // Rule 1: Must be authenticated
    const driverProfile = await UserService.getUser(auth.userId);
    if (!driverProfile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Rule 2: Must have role livreur
    if (driverProfile.role !== 'livreur') {
      res.status(403).json({ error: 'Forbidden: Only drivers can view available deliveries' });
      return;
    }

    // Rule 3: Must be available (isAvailable === true)
    if (!driverProfile.driverProfile?.isAvailable) {
      res.status(403).json({ error: 'You must set yourself as available first' });
      return;
    }

    const deliveries = await OrderService.getAvailableDeliveries();
    res.status(200).json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Atomic assignment — Firestore transaction prevents race conditions.
 * Returns 409 if another driver already took the order.
 */
export const assign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;
    const orderId = req.params.id as string;

    const driverProfile = await UserService.getUser(auth.userId);
    if (!driverProfile || driverProfile.role !== 'livreur') {
      res.status(403).json({ error: 'Forbidden: Only drivers can accept deliveries' });
      return;
    }
    if (!driverProfile.driverProfile?.isAvailable) {
      res.status(403).json({ error: 'You must set yourself as available first' });
      return;
    }

    await OrderService.assignDriver(orderId, auth.userId);
    res.status(200).json({ message: 'Delivery accepted' });
  } catch (error: any) {
    const code = error.code === 409 ? 409 : error.code === 404 ? 404 : 500;
    res.status(code).json({ error: error.message });
  }
};

/**
 * Only the assigned driver can mark the order as COMPLETED.
 */
export const complete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auth } = req as any;
    const orderId = req.params.id as string;

    await OrderService.completeDelivery(orderId, auth.userId);
    res.status(200).json({ message: 'Delivery completed' });
  } catch (error: any) {
    const code = error.code === 403 ? 403 : error.code === 404 ? 404 : error.code === 409 ? 409 : 500;
    res.status(code).json({ error: error.message });
  }
};

/**
 * Vendor-only status updates with strict transition matrix.
 */
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const { auth } = req as any;
    const orderId = req.params.id as string;

    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const actor = await UserService.getUser(auth.userId);
    if (!actor) {
      res.status(403).json({ error: 'User not found' });
      return;
    }

    // Only vendors use this endpoint. Drivers use /assign or /complete.
    if (actor.role !== 'vendeur') {
      res.status(403).json({ error: 'Forbidden: Only vendors can update order status via this endpoint. Drivers use /assign or /complete.' });
      return;
    }

    await OrderService.updateOrderStatus(orderId as string, status, auth.userId, 'vendeur');
    res.status(200).json({ message: 'Order status updated' });
  } catch (error: any) {
    const code = error.code === 403 ? 403 : error.code === 404 ? 404 : error.code === 422 ? 422 : 400;
    res.status(code).json({ error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, phoneNumber } = req.body;
    const { auth } = req as any;

    const order = await OrderService.getOrder(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.clientId !== auth.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const isPaid = await PaymentService.verifyMobileMoneyPayment(orderId, phoneNumber);
    if (isPaid) {
      await OrderService.updatePaymentStatus(orderId, 'PAID');
      res.status(200).json({ message: 'Payment verified and updated', status: 'PAID' });
    } else {
      res.status(400).json({ message: 'Payment verification failed', status: 'UNPAID' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
