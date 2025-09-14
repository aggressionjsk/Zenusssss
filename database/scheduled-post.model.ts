import mongoose from 'mongoose'

const ScheduledPostSchema = new mongoose.Schema(
  {
    body: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    linkUrl: String,
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    // When the scheduled post was actually published
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// Create indexes for frequently queried fields
ScheduledPostSchema.index({ scheduledFor: 1, published: 1 }) // For finding posts to publish
ScheduledPostSchema.index({ user: 1, published: 1 }) // For finding user's scheduled posts

const ScheduledPost = mongoose.models.ScheduledPost || mongoose.model('ScheduledPost', ScheduledPostSchema)
export default ScheduledPost