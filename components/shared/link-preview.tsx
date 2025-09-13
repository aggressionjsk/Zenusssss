'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface LinkPreviewProps {
  url: string
}

interface LinkMetadata {
  title: string
  description: string
  image: string
  url: string
  siteName?: string
}

const LinkPreview = ({ url }: LinkPreviewProps) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // Call our API endpoint to fetch metadata
        const response = await axios.get(`/api/link-preview?url=${encodeURIComponent(url)}`)
        setMetadata(response.data)
      } catch (err) {
        console.error('Error fetching link preview:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      fetchMetadata()
    }
  }, [url])

  // Only render client-side content after hydration
  if (!isClient) {
    return (
      <div className="border border-neutral-800 rounded-md p-3 mt-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline break-all">
          {url}
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-md p-3 mt-2 flex justify-center items-center h-24">
        <Loader2 className="animate-spin text-sky-500" />
      </div>
    )
  }

  if (error || !metadata) {
    return (
      <div className="border border-neutral-800 rounded-md p-3 mt-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline break-all">
          {url}
        </a>
      </div>
    )
  }
  
  // Check if we received fallback data for unavailable previews
  const isUnavailable = metadata.title === 'Link preview unavailable';

  // If preview is unavailable, show a simplified version
  if (isUnavailable) {
    return (
      <div className="border border-neutral-800 rounded-md p-3 mt-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline break-all">
          {url}
        </a>
        <p className="text-sm text-neutral-400 mt-1">{metadata.description}</p>
      </div>
    )
  }
  
  // Otherwise show the full preview
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block border border-neutral-800 rounded-md overflow-hidden mt-2 hover:bg-neutral-900 transition"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col md:flex-row">
        {metadata.image && (
          <div className="md:w-1/3 h-32 md:h-auto overflow-hidden">
            <Image 
              src={metadata.image} 
              alt={metadata.title || 'Link preview'} 
              className="w-full h-full object-cover"
              width={300}
              height={200}
              onError={(e) => {
                // Hide image on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className={`p-3 ${metadata.image ? 'md:w-2/3' : 'w-full'}`}>
          <h3 className="font-semibold text-white truncate">{metadata.title || url}</h3>
          {metadata.description && (
            <p className="text-neutral-400 text-sm line-clamp-2 mt-1">{metadata.description}</p>
          )}
          <div className="text-neutral-500 text-xs mt-2 flex items-center">
            {metadata.siteName || url.replace(/^https?:\/\//, '').split('/')[0]}
          </div>
        </div>
      </div>
    </a>
  )
}

export default LinkPreview