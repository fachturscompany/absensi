"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"


const appearanceFormSchema = z.object({
    theme: z.enum(["light", "dark"], {
        message: "Please select a theme.",
    }),
    font: z.string().optional(),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const defaultValues: Partial<AppearanceFormValues> = {
        theme: (theme as "light" | "dark") || "light",
        font: "inter",
    }

    const form = useForm<AppearanceFormValues>({
        resolver: zodResolver(appearanceFormSchema),
        defaultValues,
    })

    // Update default values when theme changes externally or loads
    useEffect(() => {
        if (mounted && theme) {
            form.setValue("theme", theme as "light" | "dark")
        }
    }, [theme, mounted, form])


    function onSubmit(data: AppearanceFormValues) {
        setTheme(data.theme)
        toast.success("Preferences updated", {
            description: "Your appearance settings have been saved."
        })
    }

    if (!mounted) {
        return null
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="font"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Font</FormLabel>
                                <div className="relative w-max">
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-[400px]">
                                                    <SelectValue placeholder="Select font" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="inter">Inter</SelectItem>
                                                <SelectItem value="manrope">Manrope</SelectItem>
                                                <SelectItem value="system">System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                </div>
                                <FormDescription>
                                    Set the font you want to use in the dashboard.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>Theme</FormLabel>
                                <FormDescription>
                                    Select the theme for the dashboard.
                                </FormDescription>
                                <FormMessage />
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid max-w-md grid-cols-2 gap-8 pt-2"
                                >
                                    <FormItem>
                                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                            <FormControl>
                                                <RadioGroupItem value="light" className="sr-only" />
                                            </FormControl>
                                            <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                                <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                                                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                                                        <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="block w-full p-2 text-center font-normal">
                                                Light
                                            </span>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                            <FormControl>
                                                <RadioGroupItem value="dark" className="sr-only" />
                                            </FormControl>
                                            <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                                                <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                                                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                                        <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="block w-full p-2 text-center font-normal">
                                                Dark
                                            </span>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="bg-black text-white hover:bg-black/90">
                        Update preferences
                    </Button>
                </form>
            </Form>
        </div>
    )
}
