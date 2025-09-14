import { Server as ServerIO } from 'socket.io'

// Create a Socket.IO server instance
export const io = new ServerIO()

// Initialize socket event handlers
export const initializeSocketEvents = () => {
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