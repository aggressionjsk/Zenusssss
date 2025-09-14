'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/shared/header'
import { Loader2, Send, Trash2 } from 'lucide-react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNowStrict } from 'date-fns'
import { useSocket } from '@/providers/socket-provider'
import { useSession } from 'next-auth/react'

interface Message {
	_id: string
	conversation: string
	sender: {
		_id: string
		name: string
		username: string
		profileImage: string
	}
	content: string
	isRead: boolean
	createdAt: string
	updatedAt: string
}

interface Conversation {
	_id: string
	participants: {
		_id: string
		name: string
		username: string
		profileImage: string
	}[]
	isRead: boolean
	createdAt: string
	updatedAt: string
}

const ConversationPage = () => {
	const params = useParams()
	const { data: session } = useSession()
	const { socket } = useSocket()
	const [conversation, setConversation] = useState<Conversation | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [newMessage, setNewMessage] = useState('')
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const conversationId = params.conversationId as string

	useEffect(() => {
		const fetchConversation = async () => {
			try {
				const response = await axios.get(`/api/conversations/${conversationId}`)
				setConversation(response.data.conversation)
				setMessages(response.data.messages)
			} catch (error) {
				console.error('Error fetching conversation:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchConversation()
	}, [conversationId])

	useEffect(() => {
		if (socket) {
			// Join the conversation room
			socket.emit('join-conversation', conversationId)

			// Listen for new messages
			socket.on('new-message', (message: Message) => {
				if (message.conversation === conversationId) {
					setMessages((prev) => [...prev, message])
				}
			})

			return () => {
				// Leave the conversation room when component unmounts
				socket.emit('leave-conversation', conversationId)
				socket.off('new-message')
			}
		}
	}, [socket, conversationId])

	useEffect(() => {
		// Scroll to bottom when messages change
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const handleDeleteMessage = async (messageId: string) => {
		try {
			await axios.delete('/api/messages', {
				data: { messageId }
			})
			
			// Remove the message from the UI
			setMessages(messages.filter(message => message._id !== messageId))
		} catch (error) {
			console.error('Error deleting message:', error)
		}
	}

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!newMessage.trim()) return

		try {
			const response = await axios.post('/api/messages', {
				conversationId,
				content: newMessage,
			})

			// Emit the message to socket.io
			if (socket) {
				socket.emit('send-message', response.data)
			}

			// Add the message to the local state
			setMessages((prev) => [...prev, response.data])
			setNewMessage('')
		} catch (error) {
			console.error('Error sending message:', error)
		}
	}

	const getOtherParticipant = () => {
		if (!conversation) return null
		return conversation.participants.find(
			(participant) => participant._id !== session?.user?.id
		)
	}

	const otherUser = getOtherParticipant()

	return (
		<>
			<Header label={otherUser?.name || 'Conversation'} isBack />
			{isLoading ? (
				<div className="flex justify-center items-center h-24">
					<Loader2 className="animate-spin text-sky-500" />
				</div>
			) : (
				<div className="flex flex-col h-[calc(100vh-120px)]">
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.length === 0 ? (
							<div className="text-center text-neutral-500 mt-10">
								No messages yet. Start a conversation!
							</div>
						) : (
							messages.map((message) => {
								// Handle case where sender might be undefined (e.g., if user was deleted)
								const isOwn = message.sender?._id === session?.user?.id

								return (
									<div
									key={message._id}
									className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
								>
										<div
											className={`
												max-w-[70%] rounded-lg p-3
												${isOwn ? 'bg-sky-500 text-white' : 'bg-neutral-800 text-white'}
												${!message.sender ? 'opacity-70 border border-neutral-500' : ''}
												transition-all duration-200 hover:shadow-md
											`}
										>
											<div className="flex items-center gap-2 mb-1">
												{!isOwn && (
													<Avatar className="h-6 w-6">
														<AvatarImage src={message.sender?.profileImage} />
														<AvatarFallback>
															{message.sender?.name?.charAt(0) || 'D'}
														</AvatarFallback>
													</Avatar>
												)}
												<span className="text-xs opacity-70">
													{formatDistanceToNowStrict(new Date(message.createdAt))}
												</span>
												{isOwn && (
													<button 
														onClick={() => handleDeleteMessage(message._id)}
														className="text-neutral-400 hover:text-red-500 transition-all duration-200 hover:scale-110"
														title="Delete message"
													>
														<Trash2 size={14} />
													</button>
												)}
											</div>
											<div>
											<p>
											{!message.sender && <span className="italic text-neutral-400">[Deleted User] </span>}
											{message.content}
											</p>
											{isOwn && (
												<div className="text-xs text-right mt-1">
													{message.isRead ? (
														<span className="text-blue-400">Read</span>
													) : (
														<span className="text-neutral-400">Delivered</span>
													)}
												</div>
											)}
										</div>
										</div>
									</div>
								)
							})
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Message input */}
					<form
						onSubmit={handleSendMessage}
						className="border-t border-neutral-800 p-4 flex gap-2 animate-slideIn"
					>
						<input
								type="text"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								placeholder="Type a message..."
								className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 focus:outline-none focus:border-sky-500 transition-all duration-200"
							/>
						<button
							type="submit"
							disabled={!newMessage.trim()}
							className="bg-sky-500 text-white rounded-full p-2 disabled:opacity-50 hover:bg-sky-600 transition-all duration-200 hover:scale-105"
						>
							<Send size={20} />
						</button>
					</form>
				</div>
			)}
		</>
	)
}

export default ConversationPage