'use server'

import { actionClient } from '@/lib/safe-action'
import { connectToDatabase } from '@/lib/mognoose'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ReturnActionType } from '@/types'
import { idSchema, paramsSchema } from '@/lib/validation'
import SavedPost from '@/database/saved-post.model'
import Post from '@/database/post.model'
import User from '@/database/user.model'
import { revalidatePath } from 'next/cache'
import { cache } from '@/lib/cache'

// Save a post for later viewing
export const savePost = actionClient.schema(idSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id } = parsedInput // post id
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to save a post.' }
  
  await connectToDatabase()
  
  // Check if post exists
  const post = await Post.findById(id)
  if (!post) return { failure: 'Post not found.' }
  
  // Check if already saved
  const existingSave = await SavedPost.findOne({ 
    user: session.currentUser?._id,
    post: id
  })
  
  if (existingSave) return { failure: 'Post already saved.' }
  
  // Save the post
  await SavedPost.create({
    user: session.currentUser?._id,
    post: id,
    savedAt: new Date(),
    shownInFeed: false,
    lastShownAt: null
  })
  
  revalidatePath('/')
  return { status: 200 }
})

// Remove a post from saved posts
export const unsavePost = actionClient.schema(idSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id } = parsedInput // post id
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to unsave a post.' }
  
  await connectToDatabase()
  
  // Delete the saved post record
  await SavedPost.findOneAndDelete({
    user: session.currentUser?._id,
    post: id
  })
  
  revalidatePath('/')
  return { status: 200 }
})

// Get all saved posts for a user
export const getSavedPosts = actionClient.schema(paramsSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { page, pageSize } = parsedInput
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to view saved posts.' }
  
  await connectToDatabase()
  
  const skipAmount = (+page - 1) * +pageSize
  
  // Create a cache key for the saved posts
  const cacheKey = `saved_posts_${session.currentUser?._id}_${page}_${pageSize}`
  
  // Try to get saved posts from cache first
  return await cache.getOrSet(
    cacheKey,
    async () => {
      // Find saved posts
      const savedPosts = await SavedPost.find({ user: session.currentUser?._id })
        .sort({ savedAt: -1 })
        .skip(skipAmount)
        .limit(+pageSize)
        .populate({
          path: 'post',
          populate: {
            path: 'user',
            model: User,
            select: 'name email profileImage _id username'
          }
        })
      
      const totalSavedPosts = await SavedPost.countDocuments({ user: session.currentUser?._id })
      const isNext = totalSavedPosts > skipAmount + savedPosts.length
      
      // Format posts for frontend
      const filteredPosts = savedPosts
        .filter(savedPost => savedPost.post) // Filter out any null posts (deleted posts)
        .map(savedPost => {
          const post = savedPost.post
          return {
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
            hasLiked: post.likes.includes(session.currentUser?._id),
            linkUrl: post.linkUrl,
            _id: post._id,
            savedAt: savedPost.savedAt,
            isSaved: true
          }
        })
      
      return JSON.parse(JSON.stringify({ posts: filteredPosts, isNext }))
    },
    30 * 1000 // Cache for 30 seconds
  )
})

// Mark a saved post as shown in feed
export const markSavedPostAsShown = actionClient.schema(idSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id } = parsedInput // saved post id
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to update saved posts.' }
  
  await connectToDatabase()
  
  await SavedPost.findByIdAndUpdate(id, {
    shownInFeed: true,
    lastShownAt: new Date()
  })
  
  return { status: 200 }
})