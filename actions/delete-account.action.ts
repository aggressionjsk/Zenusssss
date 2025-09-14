'use server'

import Notification from '@/database/notification.model'
import Post from '@/database/post.model'
import User from '@/database/user.model'
import Comment from '@/database/comment.model'
import { authOptions } from '@/lib/auth-options'
import { connectToDatabase } from '@/lib/mognoose'
import { actionClient } from '@/lib/safe-action'
import { idSchema } from '@/lib/validation'
import { ReturnActionType } from '@/types'
import { getServerSession } from 'next-auth'
// Remove client-side import as it can't be used in server actions
// import { signOut } from 'next-auth/react'

export const deleteAccount = actionClient.schema(idSchema).action<ReturnActionType>(async ({ parsedInput }) => {
  const { id } = parsedInput
  await connectToDatabase()
  
  const session = await getServerSession(authOptions)
  if (!session) return { failure: 'You need to be logged in to delete your account', status: 401 }
  
  // Verify the user is deleting their own account
  if (session.currentUser?._id !== id) {
    return { failure: 'You can only delete your own account', status: 403 }
  }
  
  try {
    // Delete all user's posts
    await Post.deleteMany({ user: id })
    
    // Delete all user's comments
    await Comment.deleteMany({ user: id })
    
    // Delete all notifications related to the user
    await Notification.deleteMany({ user: id })
    
    // Remove user from other users' followers and following lists
    await User.updateMany(
      { followers: id },
      { $pull: { followers: id } }
    )
    
    await User.updateMany(
      { following: id },
      { $pull: { following: id } }
    )
    
    // Finally, delete the user
    await User.findByIdAndDelete(id)
    
    // The session will be automatically invalidated on next request
    // because the auth-options.ts session callback checks if the user exists
    // and returns null if not, which invalidates the session
    
    // Return a flag indicating the client should force sign out
    return { status: 200, message: 'Account deleted successfully', shouldSignOut: true, forceLogout: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { failure: 'Failed to delete account', status: 500 }
  }
})