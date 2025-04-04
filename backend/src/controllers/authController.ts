import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { AppError } from '../middlewares/errorMiddleware';

type UserDocument = mongoose.Document<unknown, {}, IUser> & IUser & {
  _id: mongoose.Types.ObjectId;
};

// Generate JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

interface AuthRequest extends Request {
  user?: UserDocument;
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  }) as UserDocument;

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id.toString()),
      },
    });
  } else {
    throw new AppError('Invalid user data', 400);
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }) as UserDocument | null;

  if (user && (await user.comparePassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id.toString()),
      },
    });
  } else {
    throw new AppError('Invalid email or password', 401);
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    throw new AppError('User ID not found', 401);
  }

  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('watchHistory', 'title thumbnailUrl')
    .populate('watchlist', 'title thumbnailUrl') as UserDocument | null;

  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    throw new AppError('User not found', 404);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    throw new AppError('User ID not found', 401);
  }

  const user = await User.findById(req.user._id) as UserDocument | null;

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save() as UserDocument;

    res.json({
      success: true,
      data: {
        _id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id.toString()),
      },
    });
  } else {
    throw new AppError('User not found', 404);
  }
});

// @desc    Add video to watchlist
// @route   POST /api/auth/watchlist/:videoId
// @access  Private
export const addToWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    throw new AppError('User ID not found', 401);
  }

  const user = await User.findById(req.user._id) as UserDocument | null;
  const videoId = new mongoose.Types.ObjectId(req.params.videoId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.watchlist.some(id => id.equals(videoId))) {
    throw new AppError('Video already in watchlist', 400);
  }

  user.watchlist.push(videoId);
  await user.save();

  res.json({
    success: true,
    message: 'Video added to watchlist',
    data: user.watchlist,
  });
});

// @desc    Remove video from watchlist
// @route   DELETE /api/auth/watchlist/:videoId
// @access  Private
export const removeFromWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    throw new AppError('User ID not found', 401);
  }

  const user = await User.findById(req.user._id) as UserDocument | null;
  const videoId = new mongoose.Types.ObjectId(req.params.videoId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.watchlist = user.watchlist.filter(id => !id.equals(videoId));
  await user.save();

  res.json({
    success: true,
    message: 'Video removed from watchlist',
    data: user.watchlist,
  });
});