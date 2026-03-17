"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import {
    Trash,
    Pencil,
    ChevronRight,
    Plus,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { toast } from "sonner"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IRole } from "@/interface"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { createRole, deleteRole, getAllRole, updateRole } from "@/action/role"
import { useOrgGuard } from "@/hooks/use-org-guard"
import { useHydration } from "@/hooks/useHydration"

const roleSchema = z.object({
    code: z.string().min(2, "min 2 characters"),
    name: z.string().min(2, "min 2 characters"),
    description: z.string().optional(),

})

type RoleForm = z.infer<typeof roleSchema>

export default function RolesPage() {
    const { organizationId } = useHydration()
    useOrgGuard()

    const [open, setOpen] = React.useState(false)
    const [editingDetail, setEditingDetail] = React.useState<IRole | null>(null)
    const [roles, setroles] = React.useState<IRole[]>([])

    const [loading, setLoading] = React.useState<boolean>(true)

    const fetchroles = async () => {
        try {
            setLoading(true)

            if (!organizationId) {
                toast.error('Please select an organization')
                setLoading(false)
                return
            }

            const response: unknown = await getAllRole()
            const typedResponse = response as { success: boolean; data: IRole[]; message: string }
            if (!typedResponse.success) throw new Error(typedResponse.message)

            setroles(typedResponse.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchroles()
    }, [organizationId, fetchroles])

    const form = useForm<RoleForm>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            code: "",
            name: "",
            description: "",
        },
    })

    const handleSubmit = async (values: RoleForm) => {
        try {
            if (!organizationId) {
                toast.error('Please select an organization')
                return
            }

            let res
            if (editingDetail) {
                res = await updateRole(editingDetail.id, values)
            } else {
                res = await createRole(values)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDetail ? 'Saved successfully' : 'Role created successfully')
            setOpen(false)
            setEditingDetail(null)
            fetchroles()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDelete = async (roleId: string | number) => {
        try {
            setLoading(true)
            const result = await deleteRole(roleId)
            if (!result.success) throw new Error(result.message)
            toast.success('Role deleted successfully')
            fetchroles()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    // --- definisi kolom ---
    const columns: ColumnDef<IRole>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "description", header: "Description" },


        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const ws = row.original
                return (
                    <div className="flex gap-2 justify-end items-end">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingDetail(ws)
                                form.reset(ws)
                                setOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-red-500 border-0 cursor-pointer"
                                >
                                    <Trash />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this role?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={async () => {
                                            if (ws.id) {
                                                await handleDelete(ws.id)
                                            }
                                        }}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Link href={`/role/role-permission/${ws.id}`}>
                            <Button variant={"outline"} className="border-2 cursor-pointer">
                                Permissions<ChevronRight />
                            </Button>
                        </Link>

                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-4 w-full">

            <div className="w-full">
                <div className=" items-center my-7">

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild className="float-end ml-5">
                            <Button
                                onClick={() => {
                                    setEditingDetail(null)
                                    form.reset()
                                }}
                            >
                                Add Role <Plus className="ml-2" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingDetail ? 'Edit Role' : 'Add Role'}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(handleSubmit)}
                                    className="space-y-4"
                                >

                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Code</FormLabel>
                                                <FormControl>
                                                    <Input type="text" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input type="text" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input type="text" {...field ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />


                                    <Button type="submit" className="w-full">
                                        {editingDetail ? 'Update' : 'Create'}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                {loading ? (
                    <TableSkeleton rows={5} columns={4} />
                ) : (
                    <div className="min-w-full overflow-x-auto">
                        <DataTable columns={columns} data={roles} />
                    </div>
                )}
            </div>
        </div>
    )
}
