import Header from '@/components/shared/header'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <div>
      {children}
    </div>
  )
}