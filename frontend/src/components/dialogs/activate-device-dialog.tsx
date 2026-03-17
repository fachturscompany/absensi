"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IDeviceType } from "@/interface"
import { activateDevice, getDeviceTypes } from "@/action/attendance_device"
import { createClient } from "@/utils/supabase/client"

const activationSchema = z.object({
    deviceCode: z.string().min(1, "Device code is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
})

type ActivationForm = z.infer<typeof activationSchema>

interface ActivateDeviceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ActivateDeviceDialog({
    open,
    onOpenChange,
    onSuccess,
}: ActivateDeviceDialogProps) {
    const [deviceTypes, setDeviceTypes] = React.useState<IDeviceType[]>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedDeviceCode, setSelectedDeviceCode] = React.useState<string>("")
    const [organizationId, setOrganizationId] = React.useState<number | null>(null)

    const activationForm = useForm<ActivationForm>({
        resolver: zodResolver(activationSchema),
        defaultValues: {
            deviceCode: "",
            serialNumber: "",
        },
    })

    React.useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .single()
                if (profile?.organization_id) {
                    setOrganizationId(profile.organization_id)
                }
            }
            const response = await getDeviceTypes()
            if (response.success) {
                setDeviceTypes(response.data)
            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

    const handleActivation = async (data: ActivationForm) => {
        if (!organizationId) {
            toast.error("Organization ID not found")
            return
        }
        setLoading(true)
        try {
            const fullSerialNumber = `${data.deviceCode}-${data.serialNumber}`
            const result = await activateDevice(
                fullSerialNumber,
                organizationId
            )

            if (result.success) {
                toast.success("Device activated successfully")
                activationForm.reset()
                setSelectedDeviceCode("")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.message || "Failed to activate device")
            }
        } catch (error) {
            toast.error("An error occurred while activating device")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            activationForm.reset()
            setSelectedDeviceCode("")
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader className='bg-white text-black pb-4 rounded-t-lg border-b-2 border-black-300'>
                    <DialogTitle>Activate Device</DialogTitle>
                </DialogHeader>

                <Form {...activationForm}>
                    <form
                        onSubmit={activationForm.handleSubmit(handleActivation)}
                        className="space-y-6"
                    >
                        <FormField
                            control={activationForm.control}
                            name="deviceCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Device Type</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value)
                                            setSelectedDeviceCode(value)
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select device type..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {deviceTypes.map((dt) => (
                                                <SelectItem key={dt.id} value={dt.code || ""}>
                                                    {dt.name} ({dt.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={activationForm.control}
                            name="serialNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serial Number</FormLabel>
                                    <FormControl>
                                        <div className="flex h-10 rounded-md overflow-hidden border border-gray-300">
                                            <div className="bg-gray-100 border-r border-gray-300 px-3 text-sm font-medium text-gray-700 flex items-center whitespace-nowrap min-w-fit">
                                                {selectedDeviceCode || "CODE"}
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder="Enter serial number"
                                                className="border-0 flex-1 h-10 focus:outline-none focus:ring-0"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    {selectedDeviceCode && field.value && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-xs text-gray-600">Preview Full Serial Number:</p>
                                            <p className="text-sm font-semibold text-blue-600 mt-1">{selectedDeviceCode}-{field.value}</p>
                                        </div>
                                    )}
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || !selectedDeviceCode}>
                                {loading ? "Activating..." : "Activate "}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
