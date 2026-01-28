import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';
import fileUpload from '@/middleware/multer/fileUpload.js';
import { Controller as uploadFileController } from '@/components/admin/file/uploadFile.js';


const router = express.Router();

router.post('/upload', PrivateRoute, fileUpload.single('file'), WithDatabase(uploadFileController));


export default router;
