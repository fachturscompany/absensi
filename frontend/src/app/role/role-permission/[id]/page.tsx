"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { toast } from "sonner"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getAllPermission } from "@/action/permission"
import { getRolePermissions, createRolePermission } from "@/action/role_permission"
import { IPermission, IRolePermission } from "@/interface"

const schema = z.object({
  permission_ids: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

export default function RolePermissionPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = Number(params.id)

  const [permissions, setPermissions] = useState<IPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { permission_ids: [] },
  })

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [permRes, rolePermRes] = await Promise.all([
          getAllPermission(),
          getRolePermissions(roleId),
        ])

        if (!permRes.success) throw new Error(permRes.message)
        if (!rolePermRes.success) throw new Error(rolePermRes.message)

        setPermissions(permRes.data)

        const rolePermIds = (rolePermRes.data as IRolePermission[]).map((rp: IRolePermission) => rp.permission_id)
        form.reset({ permission_ids: rolePermIds })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [roleId])

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      if (!values.permission_ids) values.permission_ids = []

      // siapkan data untuk insert baru
      const insertData = values.permission_ids.map((pid) => ({
        role_id: roleId,
        permission_id: pid,
      }))

      // createRolePermission sudah handle "hapus lama → insert baru"
      const res = await createRolePermission(insertData)
      if (!res.success) throw new Error(res.message)

      toast.success("Permissions updated successfully")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleGoBack = () => {
    router.back();
  };

  const handleSelectAll = (_moduleName: string, permissions: IPermission[]) => {
    const currentValues = form.getValues("permission_ids") || []
    const modulePermissionIds = permissions.map((p: IPermission) => p.id)
    const allSelected = modulePermissionIds.every(id => currentValues.includes(id))

    if (allSelected) {
      // Deselect all in this module
      const newValues = currentValues.filter(id => !modulePermissionIds.includes(id))
      form.setValue("permission_ids", newValues)
    } else {
      // Select all in this module
      const newValues = [...new Set([...currentValues, ...modulePermissionIds])]
      form.setValue("permission_ids", newValues)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 🔹 group berdasarkan module
  const groupedPermissions = permissions.reduce((acc: Record<string, IPermission[]>, perm: IPermission) => {
    const moduleName = perm.module || "Other"
    if (!acc[moduleName]) acc[moduleName] = []
    acc[moduleName].push(perm)
    return acc
  }, {})

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
        {/* Header with Go Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Role Permissions
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure permissions for Role ID: {roleId}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="permission_ids"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-6">
                    {Object.keys(groupedPermissions).map((moduleName) => {
                      const modulePermissions = groupedPermissions[moduleName]
                      if (!modulePermissions) return null
                      const modulePermissionIds = modulePermissions.map((p: IPermission) => p.id)
                      const currentValues = field.value || []
                      const selectedCount = modulePermissionIds.filter(id => currentValues.includes(id)).length
                      const totalCount = modulePermissionIds.length
                      const allSelected = selectedCount === totalCount

                      return (
                        <Card key={moduleName} className="shadow-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg capitalize">
                                  {moduleName} Module
                                </CardTitle>
                                <CardDescription>
                                  {selectedCount} of {totalCount} permissions selected
                                </CardDescription>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll(moduleName, modulePermissions)}
                                className="text-xs"
                              >
                                {allSelected ? "Deselect All" : "Select All"}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {modulePermissions.map((perm: IPermission) => (
                                <FormItem
                                  key={perm.id}
                                  className="flex items-start space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(perm.id) || false}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...(field.value || []), perm.id])
                                        } else {
                                          field.onChange(
                                            field.value?.filter((v) => v !== perm.id)
                                          )
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="grid gap-1.5 leading-none">
                                    <FormLabel
                                      className="font-medium text-sm cursor-pointer"
                                      onClick={() => {
                                        const isChecked = field.value?.includes(perm.id) || false
                                        if (isChecked) {
                                          field.onChange(
                                            field.value?.filter((v) => v !== perm.id)
                                          )
                                        } else {
                                          field.onChange([...(field.value || []), perm.id])
                                        }
                                      }}
                                    >
                                      {perm.name}
                                    </FormLabel>
                                    {perm.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {perm.description}
                                      </p>
                                    )}
                                    {perm.code && (
                                      <p className="text-xs text-muted-foreground font-mono bg-muted px-1 rounded">
                                        {perm.code}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t bottom-0 pb-4">

              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none sm:min-w-[120px]"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
