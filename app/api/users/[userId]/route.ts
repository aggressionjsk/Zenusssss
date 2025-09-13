import User from '@/database/user.model'
import { connectToDatabase } from '@/lib/mognoose'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, route: { params: { userId: string } }) {
	try {
		await connectToDatabase()
		const body = await req.json()
		const { userId } = route.params

		const { searchParams } = new URL(req.url)
		const type = searchParams.get('type')

		if (type === 'updateImage') {
			// Convert birthDate string to Date object if it exists
			const updateData = { ...body }
			if (updateData.birthDate) {
				updateData.birthDate = new Date(updateData.birthDate)
			}
			await User.findByIdAndUpdate(userId, updateData, { new: true })
			revalidatePath(`/profile/${userId}`)
			return NextResponse.json({ message: 'User updated successfully' })
		} else if (type === 'updateFields') {
			const existUser = await User.findById(userId)

			if (body.username !== existUser.username) {
				const usernameExist = await User.exists({ username: body.username })
				if (usernameExist) {
					return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
				}
			}
			// Convert birthDate string to Date object if it exists
			const updateData = { ...body }
			if (updateData.birthDate) {
				updateData.birthDate = new Date(updateData.birthDate)
			}
			await User.findByIdAndUpdate(userId, updateData, { new: true })
			revalidatePath(`/profile/${userId}`)
			return NextResponse.json({ message: 'User updated successfully' })
		}
	} catch (error) {
		const result = error as Error
		return NextResponse.json({ error: result.message }, { status: 400 })
	}
}
