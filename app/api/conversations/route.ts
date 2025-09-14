import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mognoose'
import Conversation from '@/database/conversation.model'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Get all conversations for the current user
export async function GET(req: NextRequest) {
	try {
		await connectToDatabase()

		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id

		// Find all conversations where the current user is a participant
		const conversations = await Conversation.find({
			participants: { $in: [userId] },
		})
			.populate({
				path: 'participants',
				select: 'name username profileImage',
			})
			.populate('lastMessage')
			.sort({ updatedAt: -1 })

		return NextResponse.json(conversations)
	} catch (error) {
		console.error('Error fetching conversations:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch conversations' },
			{ status: 500 }
		)
	}
}

// Create a new conversation
export async function POST(req: NextRequest) {
	try {
		await connectToDatabase()

		const session = await getServerSession(authOptions)
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { participantId } = await req.json()
		const currentUserId = session.user.id

		if (!participantId) {
			return NextResponse.json(
				{ error: 'Participant ID is required' },
				{ status: 400 }
			)
		}

		// Check if a conversation already exists between these users
		const existingConversation = await Conversation.findOne({
			participants: { $all: [currentUserId, participantId] },
		})

		if (existingConversation) {
			return NextResponse.json(existingConversation)
		}

		// Create a new conversation
		const newConversation = await Conversation.create({
			participants: [currentUserId, participantId],
			isRead: false,
		})

		// Populate the participants
		const populatedConversation = await Conversation.findById(
			newConversation._id
		).populate({
			path: 'participants',
			select: 'name username profileImage',
		})

		return NextResponse.json(populatedConversation)
	} catch (error) {
		console.error('Error creating conversation:', error)
		return NextResponse.json(
			{ error: 'Failed to create conversation' },
			{ status: 500 }
		)
	}
}