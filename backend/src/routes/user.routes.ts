import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { avatarUpload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/profile', authenticateToken, UserController.getProfile);
router.patch('/profile', authenticateToken, UserController.updateProfile);
router.patch('/profile/avatar', authenticateToken, avatarUpload.single('image'), UserController.uploadAvatar);
router.get('/my-products', authenticateToken, UserController.getMyProducts);
router.patch('/products/:id/toggle-status', authenticateToken, UserController.toggleProductStatus);

export default router;
