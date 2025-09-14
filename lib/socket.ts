import { Server as ServerIO } from 'socket.io'

// Create a Socket.IO server instance
// We'll initialize this in the API route
let io: ServerIO | null = null

export const getIO = () => {
  if (!io) {
    // This should not happen in normal operation
    // as the io instance should be set by the API route
    console.warn('Socket.IO instance accessed before initialization')
  }
  return io
}

export const setIO = (ioInstance: ServerIO) => {
  io = ioInstance
  // Initialize socket events when the IO instance is set
  if (io) {
    initializeSocketEvents()
  }
}

// Initialize socket event handlers
export const initializeSocketEvents = () => {
  if (!io) {
    console.warn('Cannot initialize socket events: Socket.IO instance not available')
    return
  }
  
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    socket.on('join-conversation', (conversationId: string) => {
      socket.join(conversationId)
      console.log(`User joined conversation: ${conversationId}`)
    })

    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit('user-typing', { conversationId })
    })

    socket.on('stop-typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit('user-stop-typing', { conversationId })
    })

    socket.on('messages-read', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit('messages-read', { conversationId })
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id)
    })
  })
}