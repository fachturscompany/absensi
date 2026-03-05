// import { Separator } from "@/components/ui/separator"
import { UserSettingsSidebar } from "@/components/settings/UserSettingsSidebar"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    User,
    Settings,
    CreditCard,
} from "lucide-react"


const sidebarNavItems = [
    {
        title: "Profile Settings",
        href: "/account/settings", // Default active
        icon: <User className="h-4 w-4" />,
    },
    {
        title: "Account Settings",
        href: "/account/settings/account",
        icon: <Settings className="h-4 w-4" />,
    },
    {
        title: "Billing",
        href: "/account/settings/billing",
        icon: <CreditCard className="h-4 w-4" />,
    },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6 px-4 md:px-6 pt-1 pb-16">
            <div className="flex flex-col space-y-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and set e-mail preferences.
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                <aside className="w-full md:w-56 shrink-0">
                    <Card className="h-fit">
                        <CardContent className="p-1">
                            <UserSettingsSidebar items={sidebarNavItems} />
                        </CardContent>
                    </Card>
                </aside>
                <main className="flex-1 min-w-0">
                    <Card>
                        <CardContent className="p-6">
                            {children}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
