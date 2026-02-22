import { Router } from 'express';
import { getDriverLocation } from '../controllers/user.controller';

const router = Router();

router.get('/:uid/location', getDriverLocation);

export default router;
