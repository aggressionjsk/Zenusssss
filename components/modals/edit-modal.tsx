'use client'

import useEditModal from '@/hooks/useEditModal'
import { IUser } from '@/types'
import { useEffect, useState } from 'react'
import ProfileImageUpload from '../shared/profile-image-upload'
import CoverImageUpload from '../shared/cover-image-upload'
import Modal from '../ui/modal'
import { Loader2 } from 'lucide-react'
import EditForm from '../shared/edit-form'
import useAction from '@/hooks/use-action'
import { updateUser } from '@/actions/user.action'
import DeleteAccountModal from './delete-account-modal'
import { useRouter } from 'next/navigation'
import { deleteAccount } from '@/actions/delete-account.action'
import Button from '../ui/button'
import { signOut } from 'next-auth/react'

interface Props {
	user: IUser
}

const EditModal = ({ user }: Props) => {
	const { isLoading, onError, setIsLoading } = useAction()
	const [coverImage, setCoverImage] = useState('')
	const [profileImage, setProfileImage] = useState('')
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	const editModal = useEditModal()
	const router = useRouter()

	useEffect(() => {
		setCoverImage(user.coverImage)
		setProfileImage(user.profileImage)
	}, [user])

	const handleImageUpload = async (image: string, isProfileImage: boolean) => {
		setIsLoading(true)
		const res = await updateUser({ id: user._id, type: 'updateImage', [isProfileImage ? 'profileImage' : 'coverImage']: image })
		if (res?.serverError || res?.validationErrors || !res?.data) {
			return onError('Something went wrong')
		}
		if (res.data.failure) {
			return onError(res.data.failure)
		}
		if (res.data.status === 200) {
			setIsLoading(false)
		}
	}

	const bodyContent = (
		<>
			{isLoading && (
				<div className='absolute z-10 h-[300px] bg-black opacity-50 left-0 top-12 right-0 flex justify-center items-center'>
					<Loader2 className='animate-spin text-sky-500' />
				</div>
			)}
			<CoverImageUpload coverImage={coverImage} onChange={image => handleImageUpload(image, false)} />
			<ProfileImageUpload profileImage={profileImage} onChange={image => handleImageUpload(image, true)} />

			<EditForm user={user} />

			{/* Danger Zone */}
			<div className="mt-8 pt-6 border-t border-red-800 mx-4">
				<h3 className="text-red-500 font-bold text-lg mb-4">Danger Zone</h3>
				<p className="text-neutral-400 text-sm mb-4">
					Once you delete your account, there is no going back. Please be certain.
				</p>
				<Button 
					label="Delete Account" 
					danger 
					fullWidth 
					onClick={() => setIsDeleteModalOpen(true)} 
				/>
			</div>
		</>
	)

	return (
		<>
			<Modal body={bodyContent} isOpen={editModal.isOpen} onClose={editModal.onClose} isEditing />
			
			<DeleteAccountModal 
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				username={user.username}
				onConfirm={async () => {
					const result = await deleteAccount({ id: user._id })
					if (result?.data?.failure) {
						return onError(result.data.failure)
					}
					
					// Close the modal first
					editModal.onClose()
					
					// Check if we should force logout the user
					if (result?.data?.forceLogout) {
						// Force sign out with hard redirect to ensure complete session termination
						// This will clear all client state and cookies
						window.location.href = '/api/auth/signout?callbackUrl=/'
						return // Stop execution to allow the redirect to take effect
					} else if (result?.data?.shouldSignOut) {
						// Regular sign out
						await signOut({ callbackUrl: '/' })
					} else {
						// Just redirect to home page if for some reason signOut flag is not set
						router.push('/')
						router.refresh()
					}
				}}
			/>
		</>
	)
}

export default EditModal
