'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getScheduledPosts, deleteScheduledPost, publishNow } from '@/actions/scheduled-post.action'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Button from '@/components/ui/button'
import { Button as ShadcnButton } from '@/components/ui/shadcn-button'
import { toast } from '@/components/ui/use-toast'
import { Calendar, Trash, Send, Clock, AlertCircle, PlusCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ScheduledPost {
  _id: string
  body: string
  user: {
    _id: string
    name: string
    username: string
    image: string
  }
  scheduledFor: string
  createdAt: string
  hasImage?: boolean
  images?: string[]
  linkUrl?: string
  linkData?: any
  published?: boolean
}

const ScheduledPostsPage = () => {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPosts = async () => {
      if (!session?.user) return
      
      try {
        const response = await getScheduledPosts({ page: 1, pageSize: 10 })
        if (response?.data?.posts) {
          // Convert IPost to ScheduledPost format
          const formattedPosts = response.data.posts.map((post: any) => ({
            _id: post._id,
            body: post.body,
            user: post.user || session.user,
            scheduledFor: post.scheduledFor,
            createdAt: post.createdAt,
            linkUrl: post.linkUrl,
            published: false
          }));
          setPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching scheduled posts:', error)
        toast({
          title: 'Error',
          description: 'Failed to load scheduled posts',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [session])

  const handleDelete = async (postId: string) => {
    try {
      const response = await deleteScheduledPost({ id: postId })
      if (response?.data?.status === 200) {
        setPosts(posts.filter(post => post._id !== postId))
        toast({
          title: 'Success',
          description: 'Scheduled post deleted'
        })
      } else {
        throw new Error('Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete scheduled post',
        variant: 'destructive'
      })
    }
  }

  const handlePublishNow = async (postId: string) => {
    try {
      const response = await publishNow({ id: postId })
      if (response?.data?.status === 200) {
        setPosts(posts.filter(post => post._id !== postId))
        toast({
          title: 'Success',
          description: 'Post published successfully'
        })
        // Return to home page since we don't have the new post ID
        router.push('/')
      } else {
        throw new Error('Failed to publish post')
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      toast({
        title: 'Error',
        description: 'Failed to publish post',
        variant: 'destructive'
      })
    }
  }

  if (!session) {
    return (
      <Card className="bg-black border-neutral-800 max-w-md mx-auto mt-12">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
              <AlertCircle size={24} className="text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-center">Authentication Required</CardTitle>
          <CardDescription className="text-center">
            Please sign in to view and manage your scheduled posts
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pb-6">
          <Link href="/login">
            <ShadcnButton className="bg-sky-500 hover:bg-sky-600">
              Sign In
            </ShadcnButton>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar size={24} className="text-sky-500" />
          <span>Scheduled Posts</span>
        </h1>
        <Link href="/">
          <ShadcnButton variant="outline" size="sm" className="flex items-center gap-2">
            <PlusCircle size={16} />
            <span>New Post</span>
          </ShadcnButton>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-black border-neutral-800">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-40" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-black border-neutral-800 text-center py-12">
          <CardContent className="flex flex-col items-center pt-6">
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
              <Calendar size={32} className="text-sky-500" />
            </div>
            <CardTitle className="text-xl font-semibold mb-2">No scheduled posts</CardTitle>
            <CardDescription className="text-neutral-400 mb-6 max-w-md mx-auto">
              You don&apos;t have any posts scheduled for publication. Create a new post and use the schedule option to plan your content.  
            </CardDescription>
            <Link href="/">
              <ShadcnButton className="bg-sky-500 hover:bg-sky-600">
                Create a post
              </ShadcnButton>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const scheduledDate = new Date(post.scheduledFor)
            const isScheduledSoon = scheduledDate.getTime() - Date.now() < 1000 * 60 * 60 // 1 hour
            
            return (
              <Card key={post._id} className="bg-black border-neutral-800 hover:border-neutral-700 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.user.image} alt={post.user.name} />
                      <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.user.name}</p>
                      <p className="text-sm text-neutral-500">@{post.user.username}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="whitespace-pre-wrap">{post.body}</div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-3 pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "flex items-center gap-1 px-2 py-1 border",
                        isScheduledSoon 
                          ? "text-amber-500 border-amber-500/30 bg-amber-500/10" 
                          : "text-sky-500 border-sky-500/30 bg-sky-500/10"
                      )}>
                        {isScheduledSoon ? (
                          <Clock size={14} className="text-amber-500" />
                        ) : (
                          <Calendar size={14} className="text-sky-500" />
                        )}
                        <span className="text-xs font-medium">
                          {isScheduledSoon ? 'Soon' : formatDistanceToNow(scheduledDate, { addSuffix: true })}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <ShadcnButton 
                        onClick={() => handlePublishNow(post._id)}
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-sky-500 border-sky-500/30 hover:bg-sky-500/10"
                      >
                        <Send size={14} className="mr-1" />
                        <span className="text-xs">Publish now</span>
                      </ShadcnButton>
                      
                      <ShadcnButton 
                        onClick={() => handleDelete(post._id)}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash size={14} />
                      </ShadcnButton>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-neutral-400 w-full">
                    <Calendar size={12} />
                    <span>
                      Scheduled for {format(scheduledDate, 'EEEE, MMMM d, yyyy')} at {format(scheduledDate, 'h:mm a')}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ScheduledPostsPage