import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mognoose'
import Message from '@/database/message.model'
import Conversation from '@/database/conversation.model'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'



// Delete a message
export async function DELETE(req: NextRequest) {
	try {
		await connectToDatabase()

		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { messageId } = await req.json()
		const userId = session.user.id

		if (!messageId) {
			return NextResponse.json(
				{ error: 'Message ID is required' },
				{ status: 400 }
			)
		}

		// Find the message and verify the user is the sender
		const message = await Message.findOne({
			_id: messageId,
			sender: userId
		})

		if (!message) {
			return NextResponse.json(
				{ error: 'Message not found or you are not authorized to delete it' },
				{ status: 404 }
			)
		}

		// Delete the message
		await Message.findByIdAndDelete(messageId)

		// If this was the last message in the conversation, update the conversation's lastMessage
		const conversationId = message.conversation
		const lastMessage = await Message.findOne(
			{ conversation: conversationId },
			{},
			{ sort: { createdAt: -1 } }
		)

		if (lastMessage) {
			await Conversation.findByIdAndUpdate(conversationId, {
				lastMessage: lastMessage._id
			})
		} else {
			// No messages left, set lastMessage to null
			await Conversation.findByIdAndUpdate(conversationId, {
				lastMessage: null
			})
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting message:', error)
		return NextResponse.json(
			{ error: 'Failed to delete message' },
			{ status: 500 }
		)
	}
}

// Create a new message
export async function POST(req: NextRequest) {
	try {
		await connectToDatabase()

		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { conversationId, content } = await req.json()
		const senderId = session.user.id

		if (!conversationId || !content) {
			return NextResponse.json(
				{ error: 'Conversation ID and content are required' },
				{ status: 400 }
			)
		}

		// Verify the conversation exists and the user is a participant
		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: { $in: [senderId] },
		})

		if (!conversation) {
			return NextResponse.json(
				{ error: 'Conversation not found' },
				{ status: 404 }
			)
		}

		// Create the message
		const newMessage = await Message.create({
			conversation: conversationId,
			sender: senderId,
			content,
			isRead: false,
		})

		// Update the conversation's lastMessage and mark as unread
		await Conversation.findByIdAndUpdate(conversationId, {
			lastMessage: newMessage._id,
			isRead: false,
		})

		// Populate the sender information
		const populatedMessage = await Message.findById(newMessage._id).populate({
			path: 'sender',
			select: 'name username profileImage',
		})

		return NextResponse.json(populatedMessage)
	} catch (error) {
		console.error('Error creating message:', error)
		return NextResponse.json(
			{ error: 'Failed to create message' },
			{ status: 500 }
		)
	}
}