'use client'

import { IUser } from '@/types'
import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import Button from '../ui/button'
import { toast } from '../ui/use-toast'
import { createPost } from '@/actions/post.action'
import useAction from '@/hooks/use-action'
import { createComment } from '@/actions/comment.action'
import { useParams } from 'next/navigation'
import FormattingToolbar from './formatting-toolbar'

interface Props {
	placeholder: string
	user: IUser
	postId?: string
	isComment?: boolean
}

const Form = ({ placeholder, user, isComment }: Props) => {
	const { isLoading, setIsLoading, onError } = useAction()
	const [body, setBody] = useState('')
	const { postId } = useParams<{ postId: string }>() 
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const handleFormat = (formatType: 'bold' | 'italic' | 'unordered-list' | 'ordered-list') => {
		if (!textareaRef.current) return

		const textarea = textareaRef.current
		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const selectedText = body.substring(start, end)
		let formattedText = ''
		let cursorPosition = 0

		switch (formatType) {
			case 'bold':
				formattedText = `**${selectedText}**`
				cursorPosition = start + 2
				break
			case 'italic':
				formattedText = `*${selectedText}*`
				cursorPosition = start + 1
				break
			case 'unordered-list':
				// Add a dash at the beginning of each line
				formattedText = selectedText
					? selectedText
							.split('\n')
							.map(line => (line.trim() ? `- ${line}` : line))
							.join('\n')
					: '- '
				cursorPosition = start + 2
				break
			case 'ordered-list':
				// Add numbers at the beginning of each line
				if (selectedText) {
					const lines = selectedText.split('\n')
					formattedText = lines
						.map((line, index) => (line.trim() ? `${index + 1}. ${line}` : line))
						.join('\n')
				} else {
					formattedText = '1. '
				}
				cursorPosition = start + 3
				break
		}

		const newText = body.substring(0, start) + formattedText + body.substring(end)
		setBody(newText)

		// Set focus back to textarea and position cursor after formatting
		setTimeout(() => {
			textarea.focus()
			if (selectedText) {
				textarea.selectionStart = start
				textarea.selectionEnd = start + formattedText.length
			} else {
				textarea.selectionStart = cursorPosition
				textarea.selectionEnd = cursorPosition
			}
		}, 0)
	}

	const onSubmit = async () => {
		setIsLoading(true)
		let res
		if (isComment) {
			res = await createComment({ body, id: postId })
		} else {
			res = await createPost({ body })
		}
		if (res?.serverError || res?.validationErrors || !res?.data) {
			return onError('Something went wrong')
		}
		if (res.data.failure) {
			return onError(res.data.failure)
		}
		if (res.data.status === 200) {
			toast({ title: 'Success', description: 'Tweet created successfully' })
			setBody('')
		}
		setIsLoading(false)
	}

	return (
		<div className='border-b-[1px] border-neutral-800 px-5 py-2'>
			<div className='flex flex-row gap-4'>
				<Avatar>
					<AvatarImage src={user.profileImage} />
					<AvatarFallback>{user.name[0]}</AvatarFallback>
				</Avatar>

				<div className='w-full'>
					<FormattingToolbar onFormat={handleFormat} className="border-b border-neutral-800" />
					<textarea
						ref={textareaRef}
						className='disabled:opacity-80 peer resize-none mt-3 w-full bg-black ring-0 outline-none text-[20px] placeholder-neutral-500 text-white h-[50px]'
						placeholder={placeholder}
						disabled={isLoading}
						value={body}
						onChange={e => setBody(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && e.ctrlKey && onSubmit()}
					></textarea>
					<hr className='opacity-0 peer-focus:opacity-100 h-[1px] w-full border-neutral-800 transition' />
					
					<div className='mt-4 flex flex-row justify-between items-center'>
						<div className="text-xs text-neutral-500">
							Use **bold**, *italic*, - for lists
						</div>
						<Button
							label={isComment ? 'Reply' : 'Post'}
							classNames='px-8'
							disabled={isLoading || !body}
							onClick={onSubmit}
							isLoading={isLoading}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Form
