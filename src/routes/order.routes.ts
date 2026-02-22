import { Router } from 'express';
import {
  createOrder, getMyOrders, getVendorOrders, getDriverOrders,
  getAvailableDeliveries, assign, complete,
  updateStatus, verifyPayment
} from '../controllers/order.controller';
import { requireAuth } from '../middlewares/clerk';

const router = Router();

router.get('/my-orders', requireAuth, getMyOrders);
router.get('/vendor-orders', requireAuth, getVendorOrders);
router.get('/driver-orders', requireAuth, getDriverOrders);
router.get('/available-deliveries', requireAuth, getAvailableDeliveries);
router.post('/', requireAuth, createOrder);
router.post('/verify-payment', requireAuth, verifyPayment);
router.patch('/:id/status', requireAuth, updateStatus);
router.patch('/:id/assign', requireAuth, assign);
router.patch('/:id/complete', requireAuth, complete);

export default router;
