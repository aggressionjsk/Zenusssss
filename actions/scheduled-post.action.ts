'use server'

import ScheduledPost from '@/database/scheduled-post.model'
import User from '@/database/user.model'
import Post from '@/database/post.model'
import { authOptions } from '@/lib/auth-options'
import { connectToDatabase } from '@/lib/mognoose'
import { actionClient } from '@/lib/safe-action'
import { idSchema, paramsSchema, scheduledPostSchema } from '@/lib/validation'
import { detectUrl } from '@/lib/link-utils'
import { ReturnActionType } from '@/types'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

// Create a scheduled post
export const createScheduledPost = actionClient.schema(scheduledPostSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { body, scheduledFor } = parsedInput
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to schedule a post.' }
  
  // Detect links in the post content
  const linkUrl = detectUrl(body)
  
  await connectToDatabase()
  
  // Create scheduled post
  await ScheduledPost.create({ 
    body, 
    user: session.currentUser?._id,
    linkUrl,
    scheduledFor,
    published: false
  })
  
  revalidatePath('/scheduled')
  return { status: 200 }
})

// Get user's scheduled posts
export const getScheduledPosts = actionClient.schema(paramsSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { page, pageSize } = parsedInput
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to view scheduled posts.' }
  
  await connectToDatabase()
  
  const skipAmount = (+page - 1) * +pageSize
  
  // Find scheduled posts that haven't been published yet
  const [scheduledPosts, totalScheduledPosts] = await Promise.all([
    ScheduledPost.find({ 
      user: session.currentUser?._id,
      published: false
    })
    .sort({ scheduledFor: 1 }) // Sort by scheduled date ascending
    .skip(skipAmount)
    .limit(+pageSize)
    .lean(),
    ScheduledPost.countDocuments({ 
      user: session.currentUser?._id,
      published: false
    })
  ])
  
  const isNext = totalScheduledPosts > skipAmount + scheduledPosts.length
  
  // Format posts for frontend
  const formattedPosts = scheduledPosts.map(post => ({
    body: post.body,
    createdAt: post.createdAt,
    scheduledFor: post.scheduledFor,
    linkUrl: post.linkUrl,
    _id: post._id,
  }))
  
  return JSON.parse(JSON.stringify({ posts: formattedPosts, isNext }))
})

// Delete a scheduled post
export const deleteScheduledPost = actionClient.schema(idSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id } = parsedInput
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to delete a scheduled post.' }
  
  await connectToDatabase()
  
  const scheduledPost = await ScheduledPost.findById(id)
  if (!scheduledPost) return { failure: 'Scheduled post not found.' }
  
  // Check if the user owns this scheduled post
  if (scheduledPost.user.toString() !== session.currentUser?._id.toString()) {
    return { failure: 'You do not have permission to delete this scheduled post.' }
  }
  
  await ScheduledPost.findByIdAndDelete(id)
  
  revalidatePath('/scheduled')
  return { status: 200 }
})

// Edit a scheduled post
export const editScheduledPost = actionClient.schema(scheduledPostSchema.merge(idSchema)).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id, body, scheduledFor } = parsedInput
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to edit a scheduled post.' }
  
  await connectToDatabase()
  
  const scheduledPost = await ScheduledPost.findById(id)
  if (!scheduledPost) return { failure: 'Scheduled post not found.' }
  
  // Check if the user owns this scheduled post
  if (scheduledPost.user.toString() !== session.currentUser?._id.toString()) {
    return { failure: 'You do not have permission to edit this scheduled post.' }
  }
  
  // Detect links in the updated post content
  const linkUrl = detectUrl(body)
  
  await ScheduledPost.findByIdAndUpdate(id, {
    body,
    scheduledFor,
    linkUrl
  })
  
  revalidatePath('/scheduled')
  return { status: 200 }
})

// Publish scheduled posts that are due
// This function would be called by a cron job or similar
export const publishScheduledPosts = async () => {
  await connectToDatabase()
  
  const now = new Date()
  
  // Find all scheduled posts that are due and not yet published
  const scheduledPosts = await ScheduledPost.find({
    scheduledFor: { $lte: now },
    published: false
  }).populate('user')
  
  // Process each scheduled post
  for (const scheduledPost of scheduledPosts) {
    try {
      // Create a regular post from the scheduled post
      await Post.create({
        body: scheduledPost.body,
        user: scheduledPost.user._id,
        linkUrl: scheduledPost.linkUrl
      })
      
      // Increment user's post count
      const userId = scheduledPost.user._id
      const user = await User.findById(userId)
      const postCount = (user?.postCount || 0) + 1
      
      // Check if user should get the rookie badge (5+ posts)
      let badges = user?.badges || []
      if (postCount >= 5 && !badges.includes('rookie')) {
        badges.push('rookie')
        await User.findByIdAndUpdate(userId, { 
          $set: { postCount, badges }
        })
      } else {
        // Just update the post count
        await User.findByIdAndUpdate(userId, { 
          $set: { postCount }
        })
      }
      
      // Mark the scheduled post as published
      await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
        published: true,
        publishedAt: now
      })
    } catch (error) {
      console.error(`Failed to publish scheduled post ${scheduledPost._id}:`, error)
      // Continue with other posts even if one fails
    }
  }
  
  // Return the number of posts published
  return scheduledPosts.length
}

// Manually publish a scheduled post now
export const publishNow = actionClient.schema(idSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id } = parsedInput
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You must be logged in to publish a post.' }
  
  await connectToDatabase()
  
  const scheduledPost = await ScheduledPost.findById(id)
  if (!scheduledPost) return { failure: 'Scheduled post not found.' }
  
  // Check if the user owns this scheduled post
  if (scheduledPost.user.toString() !== session.currentUser?._id.toString()) {
    return { failure: 'You do not have permission to publish this post.' }
  }
  
  // Create a regular post from the scheduled post
  await Post.create({
    body: scheduledPost.body,
    user: scheduledPost.user,
    linkUrl: scheduledPost.linkUrl
  })
  
  // Increment user's post count
  const userId = session.currentUser?._id
  const user = await User.findById(userId)
  const postCount = (user?.postCount || 0) + 1
  
  // Check if user should get the rookie badge (5+ posts)
  let badges = user?.badges || []
  if (postCount >= 5 && !badges.includes('rookie')) {
    badges.push('rookie')
    await User.findByIdAndUpdate(userId, { 
      $set: { postCount, badges }
    })
  } else {
    // Just update the post count
    await User.findByIdAndUpdate(userId, { 
      $set: { postCount }
    })
  }
  
  // Mark the scheduled post as published
  await ScheduledPost.findByIdAndUpdate(id, {
    published: true,
    publishedAt: new Date()
  })
  
  revalidatePath('/')
  revalidatePath('/scheduled')
  return { status: 200 }
})