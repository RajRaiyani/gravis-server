import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';
import { Controller as getStatsController } from '@/components/admin/dashboard/getStats.js';

const router = express.Router();

router.get('/stats', PrivateRoute, WithDatabase(getStatsController));

export default router;
