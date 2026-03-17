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
import { Input } from "@/components/ui/input"

import { toast } from "sonner"
import { IUser } from "@/interface"
import { changePassword } from "@/action/account"


const accountFormSchema = z.object({
    newPassword: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),

}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type AccountFormValues = z.infer<typeof accountFormSchema>

interface AccountSettingsFormProps {
    initialData: Partial<IUser>
}

export function AccountSettingsForm({ initialData }: AccountSettingsFormProps) {
    // setUser is not needed for password change, but keeping it if we expand later
    // const setUser = useAuthStore((state) => state.setUser)

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",

        },
    })

    async function onSubmit(data: AccountFormValues) {
        try {
            const result = await changePassword(data.newPassword)

            if (result.success) {
                toast.success("Password changed successfully")
                form.reset({
                    newPassword: "",
                    confirmPassword: "",

                })
            } else {
                toast.error(result.message || "Failed to change password")
            }
        } catch (error) {
            toast.error("Something went wrong.")
        }
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-6">
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input value={initialData.email || ""} disabled className="bg-muted" />
                            </FormControl>
                            <FormDescription>
                                This is the email address associated with your account.
                            </FormDescription>
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter new password" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Enter your new password (min. 6 characters).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Confirm new password" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Please confirm your new password.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                    </div>

                    <Button type="submit" className="bg-black text-white hover:bg-black/90">
                        Save
                    </Button>
                </form>
            </Form>
        </div>
    )
}
