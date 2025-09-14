import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mognoose'
import Message from '@/database/message.model'
import Conversation from '@/database/conversation.model'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Mark messages as read
export async function POST(req: NextRequest) {
	try {
		await connectToDatabase()

		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
		}

		let body;
		try {
			body = await req.json()
		} catch (error) {
			return NextResponse.json({ 
				error: 'Invalid request body', 
				success: false,
				details: 'The request body could not be parsed as JSON'
			}, { status: 400 })
		}

		const { conversationId } = body
		const userId = session.currentUser?._id

		if (!conversationId) {
			return NextResponse.json(
				{ error: 'Conversation ID is required', success: false },
				{ status: 400 }
			)
		}

		// Verify the conversation exists and the user is a participant
		let conversation;
		try {
			conversation = await Conversation.findOne({
				_id: conversationId,
				participants: { $in: [userId] },
			})
		} catch (error) {
			return NextResponse.json({
				error: 'Invalid conversation ID format',
				success: false,
				details: 'The provided conversation ID is not valid'
			}, { status: 400 })
		}

		if (!conversation) {
			return NextResponse.json({
				error: 'Conversation not found or you are not a participant',
				success: false,
				details: 'The conversation may not exist or you may not have permission to access it'
			}, { status: 404 })
		}

		// Get the other participant's ID
		const otherParticipantId = conversation.participants.find(
			(participant: any) => participant.toString() !== userId
		);

		if (!otherParticipantId) {
			return NextResponse.json({
				error: 'Could not identify the other participant',
				success: false
			}, { status: 400 })
		}

		// Mark all messages from the other participant as read
		try {
			const result = await Message.updateMany(
				{ 
					conversation: conversationId,
					sender: otherParticipantId,
					isRead: false 
				},
				{ isRead: true }
			)

			// Mark the conversation as read for the current user
			await Conversation.findByIdAndUpdate(conversationId, {
				isRead: true
			})
			
			// Import the socket server to emit the messages-read event
			const { io } = await import('@/lib/socket')
			if (io) {
				io.to(conversationId).emit('messages-read', { conversationId })
			}

			return NextResponse.json({ 
				success: true, 
				messagesUpdated: result.modifiedCount 
			})
		} catch (error) {
			console.error('Error marking messages as read:', error)
			return NextResponse.json({
				error: 'Failed to mark messages as read',
				success: false,
				details: 'There was an error updating the message read status'
			}, { status: 500 })
		}
	} catch (error) {
		console.error('Error in read messages API:', error)
		return NextResponse.json(
			{ error: 'Internal server error', success: false },
			{ status: 500 }
		)
	}
}