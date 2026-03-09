"use client"

import { useState } from "react"
import { Pencil, Trash2, Bell, Clock, TrendingUp, TrendingDown, BarChart3, Briefcase, AlertTriangle, Share2, Package, Bot, Film, Pause, Hand, Grid3x3 } from "lucide-react"
import { NOTIFICATION_TEMPLATES, DUMMY_NOTIFICATIONS } from "@/lib/data/dummy-data"


// Dialog Components
import { Avatar, AvatarFallback } from "@/components/profile&image/avatar"
import { AddNotificationChoiceDialog } from "@/components/insights/smart-notifications/AddNotificationChoiceDialog"
import { CustomNotificationDialog } from "@/components/insights/smart-notifications/CustomNotificationDialog"
import { TemplateSelectionDialog } from "@/components/insights/smart-notifications/TemplateSelectionDialog"
import { EditNotificationDialog } from "@/components/insights/smart-notifications/EditNotificationDialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// Icon mapping
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    TrendingUp,
    Clock,
    TrendingDown,
    BarChart3,
    Briefcase,
    AlertTriangle,
    Share2,
    Package,
    Bot,
    Film,
    Pause,
    Hand,
}

function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}

export default function SmartNotificationsPage() {

    const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS)

    // Dialog state
    const [activeDialog, setActiveDialog] = useState<'none' | 'choice' | 'custom' | 'template' | 'edit'>('none')
    const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [notifToDelete, setNotifToDelete] = useState<string | null>(null)

    const recommendedTemplates = NOTIFICATION_TEMPLATES.slice(0, 3)

    const handleToggle = (id: string) => {
        setNotifications(prev => {
            const index = prev.findIndex(n => n.id === id)
            if (index === -1) return prev
            const newNotifs = [...prev]
            const updated = { ...newNotifs[index], enabled: !newNotifs[index]!.enabled }
            newNotifs[index] = updated as any
            return newNotifs
        })
    }

    const handleDelete = (id: string) => {
        setNotifToDelete(id)
        setDeleteConfirmOpen(true)
    }

    const confirmDelete = () => {
        if (!notifToDelete) return
        setNotifications(prev => prev.filter(n => n.id !== notifToDelete))
        setDeleteConfirmOpen(false)
        setNotifToDelete(null)
    }

    const renderIcon = (iconName: string) => {
        const IconComponent = iconComponents[iconName]
        return IconComponent ? <IconComponent className="w-8 h-8 text-gray-700" /> : null
    }

    const handleSaveCustom = (data: any) => {
        if (data.id) {
            // Edit existing
            setNotifications(prev => prev.map(n => {
                if (n.id === data.id) {
                    return {
                        ...n,
                        name: data.name,
                        frequency: data.frequency,
                        metric: data.metric,
                        condition: data.condition,
                        value: parseFloat(data.value) || 0,
                        unit: data.unit,
                        target: data.audienceType === 'all' ? 'All Members' :
                            `${data.selectedMembers.length + data.selectedTeams.length + data.selectedJobTypes.length} units`,
                        notifyVia: [
                            data.sendEmail ? 'Email' : '',
                            data.sendSlack ? 'Slack' : '',
                            data.showHighlights ? 'Insights' : ''
                        ].filter(Boolean) as any
                    }
                }
                return n
            }))
        } else {
            // Save new
            const newId = `notif-${Math.random().toString(36).substr(2, 9)}`
            const newNotif = {
                id: newId,
                name: data.name,
                enabled: true,
                createdBy: 'Admin',
                createdByAvatar: '👤',
                target: data.audienceType === 'all' ? 'All Members' : 'Custom Audience',
                frequency: data.frequency,
                notifyVia: [
                    data.sendEmail ? 'Email' : '',
                    data.sendSlack ? 'Slack' : '',
                    data.showHighlights ? 'Insights' : ''
                ].filter(Boolean),
                metric: data.metric,
                condition: data.condition,
                value: parseFloat(data.value) || 0,
                unit: data.unit,
                monitoredAudience: {
                    type: data.audienceTab,
                    all: data.audienceType === 'all',
                    ids: data.selectedMembers || []
                },
                recipients: {
                    type: data.recipientTab,
                    ids: data.selectedRecipientRoles || []
                },
                deliveryChannels: {
                    highlights: data.showHighlights,
                    email: data.sendEmail,
                    slack: data.sendSlack
                }
            }
            setNotifications(prev => [newNotif as any, ...prev])
        }
        setActiveDialog('none')
        setSelectedTemplateData(null)
    }

    const handleSelectTemplate = (templateId: string) => {
        const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId)
        if (template) {
            setSelectedTemplateData(template)
            setActiveDialog('custom')
        }
    }

    const handleOpenChoice = () => {
        setSelectedTemplateData(null)
        setActiveDialog('choice')
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="flex">
                <div className="flex-1 min-w-0 p-6">
                    <h1 className="text-xl font-semibold mb-5">Smart Notifications</h1>
                    <section className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recommended notifications</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recommendedTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`${template.color} border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
                                    onClick={() => handleSelectTemplate(template.id)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        {renderIcon(template.iconName)}
                                    </div>
                                    <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                                    <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span className="capitalize">{template.frequency}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bell className="w-3 h-3" />
                                            <span className="capitalize">{template.delivery.join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* View all templates card */}
                            <div
                                onClick={() => setActiveDialog('template')}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-900 hover:bg-zinc-50 transition-colors h-full"
                            >
                                <Grid3x3 className="w-8 h-8 text-gray-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">View all templates</span>
                            </div>
                        </div>
                    </section>

                    {/* Notifications Table */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-700">Notifications</h2>
                            <button
                                onClick={handleOpenChoice}
                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12"></th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created by</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Target</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Frequency</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Notify via</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {notifications.map((notification) => (
                                        <tr key={notification.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => handleToggle(notification.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notification.enabled ? 'bg-gray-900' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notification.enabled ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{notification.name}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-900 font-semibold">{initialsFromName(notification.createdBy)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-gray-500">{notification.createdBy}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{notification.target}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900 capitalize">{notification.frequency}</td>
                                            <td className="px-4 py-4 text-sm text-gray-900">{notification.notifyVia.join(', ')}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                        onClick={() => {
                                                            setSelectedTemplateData(notification)
                                                            setActiveDialog('edit')
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                        onClick={() => handleDelete(notification.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={confirmDelete}
                title="Delete Notification"
                description="Are you sure you want to delete this notification? This action cannot be undone."
                confirmText="Delete"
                destructive={true}
            />

            <AddNotificationChoiceDialog
                isOpen={activeDialog === 'choice'}
                onClose={() => setActiveDialog('none')}
                onSelectCustom={() => setActiveDialog('custom')}
                onSelectTemplate={() => setActiveDialog('template')}
            />

            <CustomNotificationDialog
                isOpen={activeDialog === 'custom'}
                onClose={() => {
                    setActiveDialog('none')
                    setSelectedTemplateData(null)
                }}
                onSave={handleSaveCustom}
                initialData={selectedTemplateData}
            />

            <TemplateSelectionDialog
                isOpen={activeDialog === 'template'}
                onClose={() => setActiveDialog('none')}
                onSelectTemplate={handleSelectTemplate}
            />

            <EditNotificationDialog
                isOpen={activeDialog === 'edit'}
                onClose={() => {
                    setActiveDialog('none')
                    setSelectedTemplateData(null)
                }}
                onSave={handleSaveCustom}
                initialData={selectedTemplateData}
            />
        </div>
    )
}
