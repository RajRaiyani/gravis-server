import express from 'express';

import productCategoryRoutes from './product-category.route.js';
import productRoutes from './product.route.js';
import inquiryRoutes from './inquiry.route.js';

const router = express.Router();


router.use('/product-categories', productCategoryRoutes);
router.use('/products', productRoutes);
router.use('/inquiry', inquiryRoutes);


export default router;
