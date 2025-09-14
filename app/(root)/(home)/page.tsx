import Form from '@/components/shared/form'
import Header from '@/components/shared/header'
import Pagination from '@/components/shared/pagination'
import PostItem from '@/components/shared/post-item'
import { authOptions } from '@/lib/auth-options'
import { IPost, SearchParams } from '@/types'
import { getServerSession } from 'next-auth'
import dynamic from 'next/dynamic'
import { getPrioritizedPosts } from '@/lib/feed-algorithm'

interface Props {
	searchParams: SearchParams
}
export default async function Page({ searchParams }: Props) {
	const session = await getServerSession(authOptions)

	// Use the prioritized feed algorithm instead of regular getPosts
	const res = await getPrioritizedPosts({
		page: parseInt(`${searchParams.page}`) || 1,
		pageSize: 10
	})

	const posts = res?.posts
	const isNext = res?.isNext || false
	const user = JSON.parse(JSON.stringify(session?.currentUser))

	return (
		<>
			<Header label='Home' />
			<Form placeholder="What's on your mind?" user={user} />
			{posts && posts.map((post: any) => <PostItem key={post._id} post={post} user={user} />)}
			<Pagination isNext={isNext} pageNumber={searchParams?.page ? +searchParams.page : 1} />
		</>
	)
}
