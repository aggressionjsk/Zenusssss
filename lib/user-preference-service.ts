'use server'

import UserPreference from '@/database/user-preference.model'
import Post from '@/database/post.model'
import { connectToDatabase } from '@/lib/mognoose'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

/**
 * Track a user interaction with content
 * This updates the user's preference model based on their behavior
 */
export const trackUserInteraction = async ({
  postId,
  interactionType,
}: {
  postId: string
  interactionType: 'view' | 'like' | 'comment' | 'save' | 'share'
}) => {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  const userId = session?.currentUser?._id

  if (!userId) return null

  try {
    // Find or create user preference document
    let userPreference = await UserPreference.findOne({ user: userId })

    if (!userPreference) {
      userPreference = new UserPreference({
        user: userId,
        interactionHistory: [],
        topicPreferences: new Map(),
      })
    }

    // Add interaction to history
    userPreference.interactionHistory.push({
      postId,
      interactionType,
      timestamp: new Date(),
    })

    // Limit history size to prevent document growth
    if (userPreference.interactionHistory.length > 100) {
      userPreference.interactionHistory = userPreference.interactionHistory.slice(-100)
    }

    // Update behavior metrics
    userPreference.behaviorMetrics.lastActive = new Date()

    // Update time of day preference
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      userPreference.behaviorMetrics.activeTimePreferences.morning += 1
    } else if (hour >= 12 && hour < 17) {
      userPreference.behaviorMetrics.activeTimePreferences.afternoon += 1
    } else if (hour >= 17 && hour < 22) {
      userPreference.behaviorMetrics.activeTimePreferences.evening += 1
    } else {
      userPreference.behaviorMetrics.activeTimePreferences.night += 1
    }

    // Update content format preferences based on post
    const post = await Post.findById(postId).lean()
    if (post) {
      // Type assertion to access post properties
      const typedPost = post as { linkUrl?: string }
      if (typedPost.linkUrl) {
        userPreference.contentFormatPreferences.withLinks += 1
      } else {
        userPreference.contentFormatPreferences.textOnly += 1
      }
    }

    // Update last updated timestamp
    userPreference.lastUpdated = new Date()

    // Save the updated preferences
    await userPreference.save()

    return true
  } catch (error) {
    console.error('Error tracking user interaction:', error)
    return null
  }
}

/**
 * Get user preferences for the current user
 */
export const getUserPreferences = async () => {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  const userId = session?.currentUser?._id

  if (!userId) return null

  try {
    // Find user preferences
    const userPreference = await UserPreference.findOne({ user: userId }).lean()

    if (!userPreference) {
      return null
    }

    return userPreference
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return null
  }
}

/**
 * Update session metrics when user starts a new session
 */
export const updateSessionMetrics = async (sessionDuration: number) => {
  await connectToDatabase()
  const session = await getServerSession(authOptions)
  const userId = session?.currentUser?._id

  if (!userId) return null

  try {
    // Find user preferences
    const userPreference = await UserPreference.findOne({ user: userId })

    if (!userPreference) return null

    // Update average session duration (weighted average)
    const currentAvg = userPreference.behaviorMetrics.averageSessionDuration
    const sessionCount = userPreference.interactionHistory.length || 1
    const newAvg = (currentAvg * (sessionCount - 1) + sessionDuration) / sessionCount

    userPreference.behaviorMetrics.averageSessionDuration = newAvg
    userPreference.behaviorMetrics.dailyActiveTime += sessionDuration
    userPreference.lastUpdated = new Date()

    await userPreference.save()
    return true
  } catch (error) {
    console.error('Error updating session metrics:', error)
    return null
  }
}