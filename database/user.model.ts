import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
	{
		name: String,
		username: String,
		email: String,
		password: String,
		coverImage: String,
		profileImage: String,
		bio: String,
		location: String,
		cryptoWallet: String,
		birthDate: Date,
		following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		hasNewNotifications: Boolean,
		notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
		postCount: { type: Number, default: 0 },
		badges: { type: [String], default: [] },
	},
	{ timestamps: true }
)

const User = mongoose.models.User || mongoose.model('User', UserSchema)
export default User
