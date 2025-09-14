import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mognoose'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// This route is needed to set up the Socket.IO server
export async function GET() {
	try {
		// Connect to the database
		await connectToDatabase()
		
		// In App Router, we need to return a response
		return NextResponse.json({ message: 'Socket server is running' })
	} catch (error) {
		console.error('Socket server error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}