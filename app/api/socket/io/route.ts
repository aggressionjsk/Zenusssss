import { NextRequest } from 'next/server';
import { Server as ServerIO } from 'socket.io';
import { setIO } from '@/lib/socket';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Socket.io

const ioHandler = (req: NextRequest) => {
  if (!req.nextUrl.pathname.startsWith('/api/socket/io')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    // Create a response object with the appropriate headers for SSE
    const res = new Response(null, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

    // Get the underlying socket from the response
    const responseSocket = res.socket as any;
    
    if (!responseSocket) {
      console.error('Socket not available');
      return new Response('Socket not available', { status: 500 });
    }
    
    // Create a new Socket.IO server instance
    const io = new ServerIO(responseSocket.server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    // Set the Socket.IO instance and initialize event handlers
    setIO(io);

    return res;
  } catch (error) {
    console.error('Socket.io server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export async function GET(req: NextRequest) {
  return ioHandler(req);
}

export async function POST(req: NextRequest) {
  return ioHandler(req);
}

export async function PUT(req: NextRequest) {
  return ioHandler(req);
}

export async function DELETE(req: NextRequest) {
  return ioHandler(req);
}

export async function PATCH(req: NextRequest) {
  return ioHandler(req);
}

export async function OPTIONS(req: NextRequest) {
  return ioHandler(req);
}

export async function HEAD(req: NextRequest) {
  return ioHandler(req);
}