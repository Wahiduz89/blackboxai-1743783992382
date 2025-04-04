import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Video, { IVideo } from '../models/Video';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { AppError } from '../middlewares/errorMiddleware';

type VideoDocument = mongoose.Document<unknown, {}, IVideo> & IVideo & {
  _id: mongoose.Types.ObjectId;
};

interface QueryString {
  keyword?: string;
  genre?: string;
  page?: string;
  limit?: string;
}

// @desc    Get all videos with filtering and pagination
// @route   GET /api/videos
// @access  Public
export const getVideos = asyncHandler(async (req: Request, res: Response) => {
  const pageSize = 12;
  const page = Number(req.query.page) || 1;
  const query: QueryString = req.query;

  // Build filter object
  const filter: any = {};
  
  if (query.keyword) {
    filter.$or = [
      { title: { $regex: query.keyword, $options: 'i' } },
      { description: { $regex: query.keyword, $options: 'i' } }
    ];
  }

  if (query.genre) {
    filter.genre = { $in: [query.genre] };
  }

  // Only show published videos for non-admin users
  if (!(req as any).user?.isAdmin) {
    filter.isPublished = true;
  }

  const count = await Video.countDocuments(filter);
  const videos = await Video.find(filter)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: {
      videos,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    }
  });
});

// @desc    Get featured videos
// @route   GET /api/videos/featured
// @access  Public
export const getFeaturedVideos = asyncHandler(async (req: Request, res: Response) => {
  const videos = await Video.find({ isFeatured: true, isPublished: true })
    .limit(6)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: videos
  });
});

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Public
export const getVideoById = asyncHandler(async (req: Request, res: Response) => {
  const video = await Video.findById(req.params.id) as VideoDocument | null;

  if (video) {
    // Increment views
    video.views += 1;
    await video.save();

    res.json({
      success: true,
      data: video
    });
  } else {
    throw new AppError('Video not found', 404);
  }
});

// @desc    Create a video
// @route   POST /api/videos
// @access  Private/Admin
export const createVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await Video.create({
    ...req.body,
    isPublished: false
  }) as VideoDocument;

  res.status(201).json({
    success: true,
    data: video
  });
});

// @desc    Update a video
// @route   PUT /api/videos/:id
// @access  Private/Admin
export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await Video.findById(req.params.id) as VideoDocument | null;

  if (video) {
    Object.assign(video, req.body);
    const updatedVideo = await video.save();

    res.json({
      success: true,
      data: updatedVideo
    });
  } else {
    throw new AppError('Video not found', 404);
  }
});

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private/Admin
export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await Video.findById(req.params.id);

  if (video) {
    await video.deleteOne();
    res.json({
      success: true,
      message: 'Video removed'
    });
  } else {
    throw new AppError('Video not found', 404);
  }
});

// @desc    Get videos by genre
// @route   GET /api/videos/genre/:genre
// @access  Public
export const getVideosByGenre = asyncHandler(async (req: Request, res: Response) => {
  const videos = await Video.find({
    genre: { $in: [req.params.genre] },
    isPublished: true
  })
    .limit(10)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: videos
  });
});

// @desc    Get trending videos (most viewed)
// @route   GET /api/videos/trending
// @access  Public
export const getTrendingVideos = asyncHandler(async (req: Request, res: Response) => {
  const videos = await Video.find({ isPublished: true })
    .sort({ views: -1 })
    .limit(10);

  res.json({
    success: true,
    data: videos
  });
});

// @desc    Update video publish status
// @route   PATCH /api/videos/:id/publish
// @access  Private/Admin
export const updatePublishStatus = asyncHandler(async (req: Request, res: Response) => {
  const video = await Video.findById(req.params.id) as VideoDocument | null;

  if (video) {
    video.isPublished = !video.isPublished;
    const updatedVideo = await video.save();

    res.json({
      success: true,
      data: updatedVideo
    });
  } else {
    throw new AppError('Video not found', 404);
  }
});

// @desc    Update video featured status
// @route   PATCH /api/videos/:id/feature
// @access  Private/Admin
export const updateFeaturedStatus = asyncHandler(async (req: Request, res: Response) => {
  const video = await Video.findById(req.params.id) as VideoDocument | null;

  if (video) {
    video.isFeatured = !video.isFeatured;
    const updatedVideo = await video.save();

    res.json({
      success: true,
      data: updatedVideo
    });
  } else {
    throw new AppError('Video not found', 404);
  }
});