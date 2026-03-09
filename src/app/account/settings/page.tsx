// import { Separator } from "@/components/ui/separator"
import { ProfileSettingsForm } from "@/components/profile&image/profile-settings-form"
import { createClient } from "@/utils/supabase/server"
import { getAccountData } from "@/action/account"
import { redirect } from "next/navigation"

export default async function SettingsProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const accountResult = await getAccountData()

    if (!accountResult.success || !accountResult.data) {
        return <div>Failed to load profile data</div>
    }

    return (
        <div className="space-y-6">

            {/* <Separator /> */}
            <ProfileSettingsForm initialData={accountResult.data} />
        </div>
    )
}
