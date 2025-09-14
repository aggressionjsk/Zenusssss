import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mognoose'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type NextApiResponseWithSocket = NextApiResponse & {
	socket: {
		server: NetServer & {
			io?: ServerIO
		}
	}
}

interface NextApiResponse {
	socket: any
}

// This route is needed to set up the Socket.IO server
export async function GET(req: NextApiRequest, res: NextApiResponseWithSocket) {
	try {
		// Connect to the database
		await connectToDatabase()
		
		if (!res.socket.server.io) {
			const httpServer: NetServer = res.socket.server
			const io = new ServerIO(httpServer, {
				path: '/api/socket/io',
				addTrailingSlash: false,
			})

		// Socket.IO event handlers
		io.on('connection', (socket) => {
			console.log('Socket connected:', socket.id)

			// Join a conversation room
			socket.on('join-conversation', (conversationId: string) => {
				socket.join(conversationId)
				console.log(`Socket ${socket.id} joined conversation: ${conversationId}`)
			})

			// Leave a conversation room
			socket.on('leave-conversation', (conversationId: string) => {
				socket.leave(conversationId)
				console.log(`Socket ${socket.id} left conversation: ${conversationId}`)
			})

			// Send a new message
			socket.on('send-message', (message: any) => {
				io.to(message.conversation).emit('new-message', message)
				console.log(`New message in conversation: ${message.conversation}`)
			})

			// Handle disconnection
			socket.on('disconnect', () => {
				console.log('Socket disconnected:', socket.id)
			})
		})

			res.socket.server.io = io
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Socket server error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}