import { NextResponse } from 'next/server';
import { publishScheduledPosts } from '@/actions/scheduled-post.action';

// This route is intended to be called by a cron job service like Vercel Cron
// It will publish all scheduled posts that are due
export async function GET() {
  try {
    const publishedCount = await publishScheduledPosts();
    
    return NextResponse.json({
      success: true,
      message: `Published ${publishedCount} scheduled posts`
    });
  } catch (error) {
    console.error('Error publishing scheduled posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to publish scheduled posts' 
      },
      { status: 500 }
    );
  }
}