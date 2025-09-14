import mongoose from 'mongoose'

const SavedPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    // Tracks if this saved post has been shown in the feed
    shownInFeed: {
      type: Boolean,
      default: false,
    },
    // Tracks when the post was last shown in the feed
    lastShownAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// Create compound index for user+post to ensure uniqueness
SavedPostSchema.index({ user: 1, post: 1 }, { unique: true })

// Create index for finding posts that haven't been shown in feed
SavedPostSchema.index({ user: 1, shownInFeed: 1 })

// Create index for sorting by savedAt date
SavedPostSchema.index({ savedAt: -1 })

const SavedPost = mongoose.models.SavedPost || mongoose.model('SavedPost', SavedPostSchema)
export default SavedPost