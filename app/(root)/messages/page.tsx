'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/shared/header'
import { Loader2 } from 'lucide-react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNowStrict } from 'date-fns'

interface Conversation {
	_id: string
	participants: {
		_id: string
		name: string
		username: string
		profileImage: string
	}[]
	lastMessage?: {
		_id: string
		content: string
		createdAt: string
	}
	isRead: boolean
	createdAt: string
	updatedAt: string
}

const MessagesPage = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const userId = searchParams?.get('userId')
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [creatingConversation, setCreatingConversation] = useState(false)

	useEffect(() => {
		const fetchConversations = async () => {
			try {
				const response = await axios.get('/api/conversations')
				setConversations(response.data)
			} catch (error) {
				console.error('Error fetching conversations:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchConversations()
	}, [])
	
	useEffect(() => {
		if (userId && !creatingConversation) {
			const createNewConversation = async () => {
				setCreatingConversation(true)
				try {
					// Check if conversation already exists
					const existingConversation = conversations.find(conversation => 
						conversation.participants.some(participant => participant._id === userId)
					)
					
					if (existingConversation) {
						router.push(`/messages/${existingConversation._id}`)
						return
					}
					
					// Create new conversation
					const response = await axios.post('/api/conversations', { participantId: userId })
					router.push(`/messages/${response.data._id}`)
				} catch (error) {
					console.error('Error creating conversation:', error)
					setCreatingConversation(false)
				}
			}
			
			if (!isLoading) {
				createNewConversation()
			}
		}
	}, [userId, conversations, isLoading, creatingConversation, router])

	const handleConversationClick = (conversationId: string) => {
		router.push(`/messages/${conversationId}`)
	}

	const getOtherParticipant = (conversation: Conversation) => {
		return conversation.participants[0]
	}

	return (
		<>
			<Header label="Messages" />
			{isLoading ? (
				<div className="flex justify-center items-center h-24">
					<Loader2 className="animate-spin text-sky-500" />
				</div>
			) : (
				<div className="flex flex-col">
					{conversations.length === 0 ? (
						<div className="p-6 text-center text-neutral-500">
							No conversations yet
						</div>
					) : (
						conversations.map((conversation) => {
							const otherUser = getOtherParticipant(conversation)
							return (
								<div
									key={conversation._id}
									className={`
										border-b border-neutral-800 p-4 cursor-pointer hover:bg-neutral-900 transition
										${!conversation.isRead ? 'bg-neutral-900' : ''}
									`}
									onClick={() => handleConversationClick(conversation._id)}
								>
									<div className="flex items-center gap-4">
										<Avatar>
											<AvatarImage src={otherUser?.profileImage} />
											<AvatarFallback>
												{otherUser?.name?.charAt(0) || 'U'}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<div className="flex justify-between items-center">
												<h3 className="font-semibold text-white">
													{otherUser?.name}
												</h3>
												<span className="text-xs text-neutral-500">
													{conversation.lastMessage && conversation.lastMessage.createdAt
														? formatDistanceToNowStrict(new Date(conversation.lastMessage.createdAt))
														: conversation.createdAt
															? formatDistanceToNowStrict(new Date(conversation.createdAt))
															: 'Just now'}
												</span>
											</div>
											<p className="text-sm text-neutral-400 truncate">
												{conversation.lastMessage
													? conversation.lastMessage.content
													: 'Start a conversation'}
											</p>
										</div>
									</div>
								</div>
							)
						})
					)}
				</div>
			)}
		</>
	)
}

export default MessagesPage