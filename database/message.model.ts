import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema(
	{
		conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		content: String,
		isRead: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema)
export default Message