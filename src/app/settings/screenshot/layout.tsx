"use client"

import { BlurProvider } from "@/components/settings/screenshot/blur-provider"

export default function ScreenshotLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <BlurProvider>
            {children}
        </BlurProvider>
    )
}
