import { EditProfileForm } from '@/components/EditProfileForm'
import { getMeUser } from '@/utilities/getMeUser'

export default async function AccountPage() {
  const { user } = await getMeUser({ nullUserRedirect: '/login' })

  return (
    <main className="flex-1">
      <EditProfileForm initialUser={user} />
    </main>
  )
}
