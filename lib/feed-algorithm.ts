'use server'

import Post from '@/database/post.model'
import User from '@/database/user.model'
import SavedPost from '@/database/saved-post.model'
import { connectToDatabase } from '@/lib/mognoose'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import mongoose from 'mongoose'

// Import cache with error handling to prevent build failures
let cache: any = { get: () => null, set: () => {} };
try {
  const cacheModule = require('@/lib/cache');
  cache = cacheModule.cache;
} catch (error) {
  console.warn('Cache module not available, using fallback');
}

// Constants for algorithm weights
const WEIGHTS = {
  RECENCY: 0.4,       // 40% weight for post recency
  ENGAGEMENT: 0.3,    // 30% weight for engagement (likes, comments)
  RELATIONSHIP: 0.2,  // 20% weight for user relationship
  SAVED: 0.1          // 10% weight for saved posts
}

// Time decay constants
const HOUR_IN_MS = 3600000
const DAY_IN_MS = 86400000

/**
 * Calculate recency score based on post creation time
 * Newer posts get higher scores (1.0 for very recent, approaching 0 for older posts)
 */
const calculateRecencyScore = (createdAt: Date): number => {
  const now = new Date()
  const postAge = now.getTime() - new Date(createdAt).getTime()
  
  // Posts less than 1 hour old get highest score
  if (postAge < HOUR_IN_MS) {
    return 1.0
  }
  
  // Posts less than 1 day old get high score
  if (postAge < DAY_IN_MS) {
    return 0.8
  }
  
  // Posts less than 3 days old get medium score
  if (postAge < 3 * DAY_IN_MS) {
    return 0.6
  }
  
  // Posts less than 7 days old get lower score
  if (postAge < 7 * DAY_IN_MS) {
    return 0.4
  }
  
  // Posts less than 14 days old get even lower score
  if (postAge < 14 * DAY_IN_MS) {
    return 0.2
  }
  
  // Posts older than 14 days get lowest score
  return 0.1
}

/**
 * Calculate engagement score based on likes and comments
 * Higher engagement gets higher scores
 */
const calculateEngagementScore = (likesCount: number, commentsCount: number): number => {
  // Simple formula: normalize likes and comments and average them
  // These thresholds can be adjusted based on typical engagement levels
  const normalizedLikes = Math.min(likesCount / 20, 1) // Cap at 20 likes for max score
  const normalizedComments = Math.min(commentsCount / 10, 1) // Cap at 10 comments for max score
  
  return (normalizedLikes * 0.6) + (normalizedComments * 0.4) // Likes weighted slightly higher than comments
}

/**
 * Calculate relationship score based on user connections
 * Posts from users the current user follows get higher scores
 */
const calculateRelationshipScore = (postUserId: string, currentUserFollowing: string[]): number => {
  // If the current user follows the post creator, give a high score
  if (currentUserFollowing.includes(postUserId)) {
    return 1.0
  }
  
  // Otherwise give a baseline score
  return 0.2
}

/**
 * Calculate saved post score
 * Saved posts that haven't been shown in feed recently get higher scores
 */
const calculateSavedPostScore = (isSaved: boolean, lastShownAt: Date | null): number => {
  if (!isSaved) {
    return 0
  }
  
  // If the post has never been shown in feed, give it highest score
  if (!lastShownAt) {
    return 1.0
  }
  
  // Calculate how long since it was last shown
  const now = new Date()
  const timeSinceLastShown = now.getTime() - new Date(lastShownAt).getTime()
  
  // If it was shown recently, give it a lower score
  if (timeSinceLastShown < 3 * DAY_IN_MS) {
    return 0.3
  }
  
  // If it was shown a while ago, give it a higher score
  return 0.7
}

/**
 * Get prioritized posts for the feed
 * This function fetches posts and applies the prioritization algorithm
 */
export const getPrioritizedPosts = async ({ page = 1, pageSize = 10 }) => {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  const currentUserId = session?.currentUser?._id
  
  if (!currentUserId) {
    // If no user is logged in, return posts sorted by recency only
    return getDefaultPosts({ page, pageSize })
  }
  
  // Create a cache key based on the user and pagination
  const cacheKey = `prioritized_posts_${currentUserId}_page_${page}_size_${pageSize}`
  
  // Try to get data from cache first (short cache time for feed to stay fresh)
  return await cache.getOrSet(
    cacheKey,
    async () => {
      // Get current user to access their following list
      const currentUser = await User.findById(currentUserId).select('following').lean()
      // Type assertion to help TypeScript recognize the following property
      const following = (currentUser as { following?: mongoose.Types.ObjectId[] })?.following || []
      
      // Fetch a larger set of recent posts to prioritize from
      // We fetch more than pageSize to have enough posts to prioritize
      const fetchMultiplier = 3
      const skipAmount = (page - 1) * pageSize
      
      // Fetch posts
      const posts = await Post.find({})
        .populate({
          path: 'user',
          model: User,
          select: 'name email profileImage _id username following followers',
        })
        .sort({ createdAt: -1 }) // Initial sort by recency
        .skip(skipAmount)
        .limit(pageSize * fetchMultiplier) // Fetch more posts than needed for prioritization
        .lean()
      
      // Get saved posts for the current user
      const savedPosts = await SavedPost.find({ user: currentUserId }).lean()
      const savedPostMap = new Map()
      savedPosts.forEach(savedPost => {
        savedPostMap.set(savedPost.post.toString(), {
          lastShownAt: savedPost.lastShownAt,
          shownInFeed: savedPost.shownInFeed
        })
      })
      
      // Calculate scores for each post
      const scoredPosts = await Promise.all(posts.map(async (post: any) => {
        const postId = post._id.toString()
        const postUserId = post.user._id.toString()
        const likesCount = post.likes.length
        const commentsCount = post.comments.length
        const savedPostInfo = savedPostMap.get(postId)
        
        // Calculate individual scores
        const recencyScore = calculateRecencyScore(post.createdAt)
        const engagementScore = calculateEngagementScore(likesCount, commentsCount)
        // Convert ObjectId array to string array before passing to calculateRelationshipScore
        const followingStrings = following.map(id => id.toString())
        const relationshipScore = calculateRelationshipScore(postUserId, followingStrings)
        const savedScore = calculateSavedPostScore(
          !!savedPostInfo,
          savedPostInfo?.lastShownAt || null
        )
        
        // Calculate final weighted score
        const finalScore = (
          recencyScore * WEIGHTS.RECENCY +
          engagementScore * WEIGHTS.ENGAGEMENT +
          relationshipScore * WEIGHTS.RELATIONSHIP +
          savedScore * WEIGHTS.SAVED
        )
        
        // Mark saved posts as shown in feed if they're included
        if (savedPostInfo && !savedPostInfo.shownInFeed) {
          await SavedPost.findOneAndUpdate(
            { user: currentUserId, post: postId },
            { shownInFeed: true, lastShownAt: new Date() }
          )
        }
        
        return {
          ...post,
          finalScore,
          hasLiked: post.likes.some((id: mongoose.Types.ObjectId) => id.toString() === currentUserId),
          likes: likesCount,
          comments: commentsCount,
          isSaved: !!savedPostInfo,
          // Include score components for debugging (can be removed in production)
          _scores: {
            recency: recencyScore,
            engagement: engagementScore,
            relationship: relationshipScore,
            saved: savedScore
          }
        }
      }))
      
      // Sort posts by final score
      scoredPosts.sort((a, b) => b.finalScore - a.finalScore)
      
      // Take only the requested page size
      const prioritizedPosts = scoredPosts.slice(0, pageSize)
      
      // Format posts for response
      const formattedPosts = prioritizedPosts.map(post => ({
        body: post.body,
        createdAt: post.createdAt,
        user: {
          _id: post.user._id,
          name: post.user.name,
          username: post.user.username,
          profileImage: post.user.profileImage,
          email: post.user.email,
        },
        likes: post.likes,
        comments: post.comments,
        hasLiked: post.hasLiked,
        isSaved: post.isSaved,
        linkUrl: post.linkUrl,
        _id: post._id,
      }))
      
      // Check if there are more posts
      const totalPosts = await Post.countDocuments({})
      const isNext = totalPosts > skipAmount + pageSize
      
      return JSON.parse(JSON.stringify({ posts: formattedPosts, isNext }))
    },
    15 * 1000 // Cache for 15 seconds (shorter than regular posts for freshness)
  )
}

/**
 * Get default posts sorted by recency (fallback for logged-out users)
 */
const getDefaultPosts = async ({ page = 1, pageSize = 10 }) => {
  const skipAmount = (page - 1) * pageSize
  
  const [posts, totalPosts] = await Promise.all([
    Post.find({})
      .populate({
        path: 'user',
        model: User,
        select: 'name email profileImage _id username',
      })
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(pageSize)
      .lean(),
    Post.countDocuments({})
  ])
  
  const formattedPosts = posts.map(post => ({
    body: post.body,
    createdAt: post.createdAt,
    user: {
      _id: post.user._id,
      name: post.user.name,
      username: post.user.username,
      profileImage: post.user.profileImage,
      email: post.user.email,
    },
    likes: post.likes.length,
    comments: post.comments.length,
    hasLiked: false, // No user is logged in
    isSaved: false,  // No user is logged in
    linkUrl: post.linkUrl,
    _id: post._id,
  }))
  
  const isNext = totalPosts > skipAmount + posts.length
  
  return { posts: formattedPosts, isNext }
}