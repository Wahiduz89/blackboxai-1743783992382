import express from 'express';
import {
  getVideos,
  getFeaturedVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideosByGenre,
  getTrendingVideos,
  updatePublishStatus,
  updateFeaturedStatus
} from '../controllers/videoController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getVideos);
router.get('/featured', getFeaturedVideos);
router.get('/trending', getTrendingVideos);
router.get('/genre/:genre', getVideosByGenre);
router.get('/:id', getVideoById);

// Protected admin routes
router.use(protect, admin);
router.post('/', createVideo);
router.route('/:id')
  .put(updateVideo)
  .delete(deleteVideo);
router.patch('/:id/publish', updatePublishStatus);
router.patch('/:id/feature', updateFeaturedStatus);

export default router;