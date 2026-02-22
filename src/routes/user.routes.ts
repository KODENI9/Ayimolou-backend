import { Router } from 'express';
import {
  syncUser, getUserProfile, getVendors,
  updateVendorProfile, updateUserRole,
  updateDriverLocation, updateDriverAvailability, getDriverLocation
} from '../controllers/user.controller';
import { requireAuth } from '../middlewares/clerk';

const router = Router();

// Users
router.post('/sync', syncUser);
router.get('/vendors', getVendors);
router.get('/:uid', requireAuth, getUserProfile);
router.patch('/:uid/vendor-profile', requireAuth, updateVendorProfile);
router.patch('/:uid/role', requireAuth, updateUserRole);

// Driver-specific
router.patch('/:uid/driver-location', requireAuth, updateDriverLocation);
router.patch('/:uid/driver-availability', requireAuth, updateDriverAvailability);

export default router;
