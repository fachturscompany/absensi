import { createClient } from "@/utils/supabase/server"
import { getAccountData } from "@/action/account"
import { redirect } from "next/navigation"
import { AccountSettingsForm } from "@/components/profile&image/account-settings-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function SettingsAccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const accountResult = await getAccountData()

    if (!accountResult.success || !accountResult.data) {
        return <div>Failed to load account data</div>
    }

    return (
        <Card className="border-none shadow-none">
            <CardContent className="p-0">
                <AccountSettingsForm initialData={accountResult.data.user} />
            </CardContent>
        </Card>
    )
}
