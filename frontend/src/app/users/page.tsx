import { getAllUsers } from "@/action/users"
import UsersClient from "./users-client"
import { IUser } from "@/interface"

// Server Component - fetch data di server
export default async function UsersPage() {
  // Fetch data di server - 1 request!
  const response = await getAllUsers()
  const users = (response.success ? response.data : []) as IUser[]

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <UsersClient initialUsers={users} />
    </div>
  )
}
