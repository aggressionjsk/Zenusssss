import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mognoose'
import Conversation from '@/database/conversation.model'
import Message from '@/database/message.model'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Get a specific conversation and its messages
export async function GET(
	req: NextRequest,
	{ params }: { params: { conversationId: string } }
) {
	try {
		await connectToDatabase()

		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.currentUser?._id
		const { conversationId } = params

		// Find the conversation and verify the user is a participant
		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: { $in: [userId] },
		}).populate({
			path: 'participants',
			select: 'name username profileImage',
		})

		if (!conversation) {
			return NextResponse.json(
				{ error: 'Conversation not found' },
				{ status: 404 }
			)
		}

		// Get messages for this conversation
		const messages = await Message.find({ conversation: conversationId })
			.populate({
				path: 'sender',
				select: 'name username profileImage',
			})
			.sort({ createdAt: 1 })

		// Mark messages as read if the current user is not the sender
		await Message.updateMany(
			{
				conversation: conversationId,
				sender: { $ne: userId },
				isRead: false,
			},
			{ isRead: true }
		)

		// Mark conversation as read
		await Conversation.findByIdAndUpdate(conversationId, { isRead: true })

		return NextResponse.json({ conversation, messages })
	} catch (error) {
		console.error('Error fetching conversation:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch conversation' },
			{ status: 500 }
		)
	}
}