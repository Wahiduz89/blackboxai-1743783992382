import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  genre: string[];
  rating: number;
  views: number;
  releaseYear: number;
  cast: string[];
  director: string;
  isPublished: boolean;
  isFeatured: boolean;
}

const videoSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required']
  },
  genre: [{
    type: String,
    required: [true, 'At least one genre is required']
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  views: {
    type: Number,
    default: 0
  },
  releaseYear: {
    type: Number,
    required: [true, 'Release year is required']
  },
  cast: [{
    type: String,
    required: [true, 'Cast members are required']
  }],
  director: {
    type: String,
    required: [true, 'Director name is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;

  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
});

// Index for search functionality
videoSchema.index({ title: 'text', description: 'text', genre: 'text' });

export default mongoose.model<IVideo>('Video', videoSchema);