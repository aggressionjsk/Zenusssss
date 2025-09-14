'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io as ClientIO, Socket } from 'socket.io-client'

export interface SocketContextType {
	socket: Socket | null
	isConnected: boolean
	isTyping: (conversationId: string) => void
	stopTyping: (conversationId: string) => void
	markMessagesAsRead: (conversationId: string) => void
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
	isTyping: () => {},
	stopTyping: () => {},
	markMessagesAsRead: () => {}
})

export const useSocket = () => {
	return useContext(SocketContext)
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const [socket, setSocket] = useState<Socket | null>(null)
	const [isConnected, setIsConnected] = useState(false)

	const isTyping = useCallback((conversationId: string) => {
		if (socket) {
			socket.emit('typing', { conversationId })
		}
	}, [socket])

	const stopTyping = useCallback((conversationId: string) => {
		if (socket) {
			socket.emit('stop-typing', { conversationId })
		}
	}, [socket])

	const markMessagesAsRead = useCallback((conversationId: string) => {
		if (socket) {
			socket.emit('messages-read', { conversationId })
		}
	}, [socket])

	useEffect(() => {
		const socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || '', {
			path: '/api/socket/io',
			addTrailingSlash: false,
		})

		socketInstance.on('connect', () => {
			setIsConnected(true)
			console.log('Socket connected')
		})

		socketInstance.on('disconnect', () => {
			setIsConnected(false)
			console.log('Socket disconnected')
		})

		setSocket(socketInstance)

		return () => {
			socketInstance.disconnect()
		}
	}, [])

	return (
		<SocketContext.Provider value={{ socket, isConnected, isTyping, stopTyping, markMessagesAsRead }}>
			{children}
		</SocketContext.Provider>
	)
}