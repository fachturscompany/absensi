"use client"

import React, { useEffect } from "react"
import { X, TrendingUp, Clock, TrendingDown, BarChart3, Briefcase, AlertTriangle, Share2, Package, Bot, Film, Pause, Hand } from "lucide-react"
import { NOTIFICATION_TEMPLATES } from "@/lib/data/dummy-data"

interface TemplateSelectionDialogProps {
    isOpen: boolean
    onClose: () => void
    onSelectTemplate: (templateId: string) => void
}

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

export function TemplateSelectionDialog({
    isOpen,
    onClose,
    onSelectTemplate
}: TemplateSelectionDialogProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            window.addEventListener("keydown", handleEsc)
        }
        return () => window.removeEventListener("keydown", handleEsc)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const renderIcon = (iconName: string) => {
        const IconComponent = iconComponents[iconName]
        return IconComponent ? <IconComponent className="w-6 h-6" /> : null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Choose from templates</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                        <p className="text-sm text-gray-500 max-w-3xl leading-relaxed">
                            Select a template from the options below to get started. Then, optionally customize the settings and assign members to monitor as well as those to receive notifications.
                        </p>
                    </div>

                    <table className="w-full table-fixed text-left">
                        <colgroup>
                            <col className="w-[60%]" />
                            <col className="w-[20%]" />
                            <col className="w-[20%]" />
                            <col className="w-[96px]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-4 text-[11px] font-bold text-zinc-900 uppercase tracking-widest">Name / Description</th>
                                <th className="px-4 py-4 text-[11px] font-bold text-zinc-900 uppercase tracking-widest text-center">Frequency</th>
                                <th className="px-4 py-4 text-[11px] font-bold text-zinc-900 uppercase tracking-widest text-center">Delivered</th>
                                <th className="px-4 py-4 text-[11px] font-bold text-zinc-900 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {NOTIFICATION_TEMPLATES.map((template) => (
                                <tr key={template.id} className="group hover:bg-gray-50/50 transition-colors align-middle">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`${template.color} w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}>
                                                {renderIcon(template.iconName)}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{template.name}</h3>
                                                <p className="text-sm text-gray-500 leading-tight line-clamp-2">{template.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-sm text-gray-700 capitalize">{template.frequency}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                            {template.delivery.map((method, idx) => (
                                                <span key={idx} className="text-sm text-gray-600 capitalize">
                                                    {method}{idx < template.delivery.length - 1 ? ',' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => onSelectTemplate(template.id)}
                                            className="px-6 py-2 bg-white border border-gray-200 rounded text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                                        >
                                            Add
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
