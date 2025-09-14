'use client'

import { useEffect, useState } from 'react'
import { updateSessionMetrics } from '@/lib/user-preference-service'

/**
 * SessionTracker component
 * Tracks user session duration and updates metrics in the database
 * This component should be included in the layout to track all sessions
 */
const SessionTracker = () => {
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  
  useEffect(() => {
    // Start tracking session when component mounts
    const startTime = Date.now()
    setSessionStartTime(startTime)
    
    // Update session metrics when user leaves the page
    const handleBeforeUnload = async () => {
      if (sessionStartTime) {
        const sessionDuration = (Date.now() - sessionStartTime) / 1000 // Convert to seconds
        await updateSessionMetrics(sessionDuration)
      }
    }
    
    // Update session metrics periodically (every 5 minutes) for long sessions
    const intervalId = setInterval(async () => {
      if (sessionStartTime) {
        const sessionDuration = (Date.now() - sessionStartTime) / 1000 // Convert to seconds
        await updateSessionMetrics(sessionDuration)
        // Reset session start time for next interval
        setSessionStartTime(Date.now())
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Clean up
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Update session metrics when component unmounts
      if (sessionStartTime) {
        const sessionDuration = (Date.now() - sessionStartTime) / 1000 // Convert to seconds
        updateSessionMetrics(sessionDuration)
      }
    }
  }, [sessionStartTime])
  
  // This component doesn't render anything
  return null
}

export default SessionTracker