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
		const userId = session.currentUser?._id

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

		const { conversationId, content } = body
		const senderId = session.currentUser?._id

		if (!conversationId) {
			return NextResponse.json(
				{ error: 'Conversation ID is required', success: false },
				{ status: 400 }
			)
		}

		if (!content || typeof content !== 'string' || content.trim() === '') {
			return NextResponse.json(
				{ error: 'Valid message content is required', success: false },
				{ status: 400 }
			)
		}

		// Verify the conversation exists and the user is a participant
		let conversation;
		try {
			conversation = await Conversation.findOne({
				_id: conversationId,
				participants: { $in: [senderId] },
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

		// Create the message
		let newMessage;
		try {
			newMessage = await Message.create({
				conversation: conversationId,
				sender: senderId,
				content,
				isRead: false,
				createdAt: new Date()
			})
		} catch (error) {
			console.error('Error creating message:', error);
			return NextResponse.json({
				error: 'Failed to create message',
				success: false,
				details: 'There was an error saving your message'
			}, { status: 500 })
		}

		// Update the conversation's lastMessage and mark as unread
		try {
			await Conversation.findByIdAndUpdate(conversationId, {
				lastMessage: newMessage._id,
				isRead: false,
				updatedAt: new Date()
			})
		} catch (error) {
			console.error('Error updating conversation:', error);
			// Message was created but conversation update failed
			// We'll still return the message but log the error
		}

		// Get the other participant to create a notification
		const otherParticipant = conversation.participants.find(
			(participant: any) => participant.toString() !== senderId
		);

		if (otherParticipant) {
			try {
				// Import the notification model
				const Notification = (await import('@/database/notification.model')).default;
				const User = (await import('@/database/user.model')).default;

				// Create a notification for the recipient
				await Notification.create({
					user: otherParticipant,
					body: `You have a new message`,
					createdAt: new Date()
				});

				// Update the recipient's hasNewNotifications flag
				await User.findByIdAndUpdate(otherParticipant, {
					$set: { hasNewNotifications: true },
				});
			} catch (error) {
				console.error('Error creating notification:', error);
				// We'll still continue since the message was created successfully
				// This is a non-critical error that shouldn't block the message creation
			}
		}

		// Populate the sender information
		let populatedMessage;
		try {
			populatedMessage = await Message.findById(newMessage._id).populate({
				path: 'sender',
				select: 'name username profileImage',
			})

			if (!populatedMessage) {
				// This should rarely happen, but just in case
				return NextResponse.json({
					message: newMessage,
					success: true,
					warning: 'Message created but sender details could not be populated'
				})
			}

			return NextResponse.json({
				message: populatedMessage,
				success: true
			})
		} catch (error) {
			console.error('Error populating message:', error);
			// Return the unpopulated message as a fallback
			return NextResponse.json({
				message: newMessage,
				success: true,
				warning: 'Message created but sender details could not be populated'
			})
		}
	} catch (error) {
		console.error('Error creating message:', error)
		let errorMessage = 'Failed to create message';
		let statusCode = 500;

		// Provide more specific error messages based on error type
		if (error instanceof Error) {
			if (error.name === 'ValidationError') {
				errorMessage = 'Message validation failed';
				statusCode = 400;
			} else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
				errorMessage = 'Duplicate message detected';
				statusCode = 409;
			}
		}

		return NextResponse.json(
			{ 
				error: errorMessage,
				success: false,
				details: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: statusCode }
		)
	}
}