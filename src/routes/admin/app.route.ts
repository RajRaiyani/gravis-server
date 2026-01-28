import express from 'express';
import userRoutes from './user.route.js';
import productCategoryRoutes from './product-category.route.js';
import productRoutes from './product.route.js';
import fileRoutes from './file.route.js';
import inquiryRoutes from './inquiry.route.js';


const router = express.Router();

router.use('/users', userRoutes);
router.use('/product-categories', productCategoryRoutes);
router.use('/products', productRoutes);
router.use('/files', fileRoutes);
router.use('/inquiry', inquiryRoutes);

export default router;
