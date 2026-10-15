import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { MAX_PRODUCT_IMAGES } from '../utils/productImages';

const router = Router();

router.get('/', optionalAuth, ProductController.getProducts);
router.get('/:id', optionalAuth, ProductController.getProductById);
router.post('/', authenticateToken, upload.array('images', MAX_PRODUCT_IMAGES), ProductController.createProduct);
router.delete('/:id', authenticateToken, ProductController.deleteProduct);

export default router;
