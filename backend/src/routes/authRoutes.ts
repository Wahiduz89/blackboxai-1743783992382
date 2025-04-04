import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addToWatchlist,
  removeFromWatchlist
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.use(protect);
router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.route('/watchlist/:videoId')
  .post(addToWatchlist)
  .delete(removeFromWatchlist);

export default router;