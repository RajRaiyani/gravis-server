import express from 'express';
import productCategoryRoutes from './product-category.route.js';
import productRoutes from './product.route.js';
import inquiryRoutes from './inquiry.route.js';
import customerRoutes from './customer.route.js';
import cartRoutes from './cart.route.js';
import orderRoutes from './order.route.js';

const router = express.Router();

router.use('/product-categories', productCategoryRoutes);
router.use('/products', productRoutes);
router.use('/inquiry', inquiryRoutes);
router.use('/customers', customerRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

export default router;
