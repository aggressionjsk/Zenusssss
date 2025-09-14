export type SearchParams = { [key: string]: string | string[] | undefined }

export interface QueryProps {
	params: string
	key: string
	value?: string | null
}

export interface IUser {
	createdAt: Date
	username: string
	email: string
	name: string
	profileImage: string
	coverImage: string
	updatedAt: Date
	_id: string
	bio: string
	location: string
	cryptoWallet?: string
	birthDate?: Date
	followers: string[]
	following: string[]
	hasNewNotifications: boolean
	notifications: string[]
	isFollowing: boolean
	postCount?: number
	badges?: string[]
}

export interface IPost {
	body: string
	comments: number
	createdAt: string
	likes: number
	updatedAt: string
	user: IUser
	_id: string
	hasLiked: boolean
	linkUrl?: string
	isSaved?: boolean
}

export interface ReturnActionType {
	posts?: IPost[]
	comments?: IPost[]
	isNext?: boolean
	failure?: string
	status?: number
	post?: IPost
	users?: IUser[]
	notifications?: IPost[]
	user?: IUser
	forceLogout?: boolean
	shouldSignOut?: boolean
	message?: string
}
