import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireActiveAccount } from '../middlewares/auth.middleware';
import { avatarUpload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken, requireActiveAccount);

router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);
router.patch('/profile/avatar', avatarUpload.single('image'), UserController.uploadAvatar);
router.get('/my-products', UserController.getMyProducts);
router.patch('/products/:id/toggle-status', UserController.toggleProductStatus);

export default router;
