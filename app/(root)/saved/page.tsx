import { getSavedPosts } from '@/actions/saved-post.action'
import Header from '@/components/shared/header'
import Pagination from '@/components/shared/pagination'
import PostItem from '@/components/shared/post-item'
import { authOptions } from '@/lib/auth-options'
import { SearchParams } from '@/types'
import { getServerSession } from 'next-auth'

interface Props {
	searchParams: SearchParams
}

export default async function SavedPostsPage({ searchParams }: Props) {
	const session = await getServerSession(authOptions)

	const res = await getSavedPosts({
		page: parseInt(`${searchParams.page}`) || 1,
		pageSize: 10
	})

	const posts = res?.data?.posts || []
	const isNext = res?.data?.isNext || false
	const user = JSON.parse(JSON.stringify(session?.currentUser))

	return (
		<>
			<Header label='Saved Posts' />
			
			{posts.length === 0 ? (
				<div className="p-8 text-center text-neutral-400">
					<p className="text-xl mb-4">No saved posts yet</p>
					<p>When you save posts, they&apos;ll appear here for easy access.</p>
				</div>
			) : (
				<>
					{posts.map(post => <PostItem key={post._id} post={post} user={user} />)}
					<Pagination isNext={isNext} pageNumber={searchParams?.page ? +searchParams.page : 1} />
				</>
			)}
		</>
	)
}