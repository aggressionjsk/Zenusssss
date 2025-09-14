import mongoose from 'mongoose'

const ConversationSchema = new mongoose.Schema(
	{
		participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
		isRead: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema)
export default Conversation