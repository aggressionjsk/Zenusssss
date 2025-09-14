'use client'

import { Bell, Home, User, MessageCircle, Search, Bookmark, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import SidebarItem from './sidebar-item'
import SidebarPostButton from './sidebar-post-button'
import SidebarAccount from './sidebar-account'
import { IUser } from '@/types'
import { useEffect, useState } from 'react'
import axios from 'axios'

const Sidebar = ({ user }: { user: IUser }) => {
	const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

	// Check for unread messages
	useEffect(() => {
		const checkUnreadMessages = async () => {
			try {
				const response = await axios.get('/api/conversations')
				const conversations = response.data
				
				// Check if any conversation is unread
				const hasUnread = conversations.some((conversation: any) => !conversation.isRead)
				setHasUnreadMessages(hasUnread)
			} catch (error) {
				console.error('Error checking unread messages:', error)
			}
		}

		checkUnreadMessages()

		// Set up interval to check periodically
		const interval = setInterval(checkUnreadMessages, 30000) // Check every 30 seconds
		return () => clearInterval(interval)
	}, [])

	const sidebarItems = [
		{ label: 'Home', path: '/', icon: Home },
		{ label: 'Notifications', path: `/notifications/${user?._id}`, icon: Bell, notification: user?.hasNewNotifications },
		{ label: 'Messages', path: '/messages', icon: MessageCircle, notification: hasUnreadMessages },
		{ label: 'Profile', path: `/profile/${user?._id}`, icon: User },
		{ label: 'Saved', path: '/saved', icon: Bookmark },
		{ label: 'Scheduled', path: '/scheduled-posts', icon: Calendar },
		{ label: 'Explore', path: '/explore', icon: Search },
	]

	return (
		<section className='sticky left-0 top-0 h-screen lg:w-[266px] w-fit flex flex-col justify-between py-4 pl-2'>
			<div className='flex flex-col space-y-2'>
				<div className='rounded-full h-14 w-14 p-4 flex items-center justify-center hover:bg-sky-300 hover:bg-opacity-10 cursor-pointer transition'>
					<Image width={56} height={56} src={'/images/logo.svg'} alt='logo' />
				</div>

				{sidebarItems.map(item => (
					<Link key={item.path} href={item.path}>
						<SidebarItem {...item} />
					</Link>
				))}

				<SidebarPostButton />
			</div>

			<SidebarAccount user={user} />
		</section>
	)
}

export default Sidebar
