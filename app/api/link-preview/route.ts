import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Use a third-party service for link previews
    // This is a free service with rate limits, but sufficient for demo purposes
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`
    // Add timeout to prevent long-running requests
    const response = await axios.get(apiUrl, { timeout: 5000 })

    // Extract metadata from the microlink response
    const { data } = response.data
    
    // Add null check for data to prevent errors
    if (!data) {
      let siteName = '';
      try {
        siteName = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        // If URL parsing fails, use the raw URL
        siteName = url;
      }
      
      return NextResponse.json({ 
        title: '',
        description: '',
        url: url,
        siteName: siteName
      })
    }
    
    let siteName = '';
    try {
      siteName = data.publisher || new URL(url).hostname.replace('www.', '');
    } catch (e) {
      // If URL parsing fails, use the raw URL
      siteName = data.publisher || url;
    }
    
    const metadata = {
      title: data.title || '',
      description: data.description || '',
      image: data.image?.url || '',
      url: data.url || url,
      siteName: siteName}

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching link preview:', error)
    
    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.response?.status === 408) {
        console.log('Request timeout for URL:', url)
        return NextResponse.json({ 
          title: 'Link preview unavailable',
          description: 'The request timed out',
          url: url,
          siteName: 'Unknown'
        }, { status: 200 }) // Return 200 with fallback data instead of error
      }
      
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.log('Response error status:', error.response.status)
        return NextResponse.json({ 
          title: 'Link preview unavailable',
          description: 'Could not retrieve link information',
          url: url,
          siteName: 'Unknown'
        }, { status: 200 }) // Return 200 with fallback data instead of error
      }
    }
    
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 })
  }
}