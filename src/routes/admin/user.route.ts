import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';

import { ValidationSchema as userLoginValidationSchema, Controller as userLoginController } from '@/components/admin/user/loginUser.js';

const router = express.Router();

router.post('/login', validate(userLoginValidationSchema), WithDatabase(userLoginController));

export default router;
