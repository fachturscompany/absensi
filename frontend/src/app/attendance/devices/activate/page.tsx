"use client"
//tes
import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function ActivateDevicePage() {
    const router = useRouter()
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
        fetchData()
    }, [])

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
                router.push("/attendance/devices")
                router.refresh()
            } else {
                toast.error(result.message || "Failed to activate device")
            }
        } catch (error) {
            toast.error("An error occurred while activating device")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="w-full">
                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-300">
                    <div className="bg-white text-black px-6 py-4 rounded-t-lg border-b-2 border-black-300 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="p-0 h-auto"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Activate </h1>
                    </div>

                    <div className="p-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Device Activation Form</CardTitle>
                            </CardHeader>
                            <CardContent>
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

                                        <div className="flex gap-3 pt-6">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => router.back()}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={loading || !selectedDeviceCode}>
                                                {loading ? "Activating..." : "Activate "}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
