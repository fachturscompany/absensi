"use client"

import React from "react"

interface EmptyStateProps {
    message?: string
}

export function EmptyState({ message = "No data for this date range" }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
            {/* Simple SVG Illustration of a person looking with magnifying glass */}
            <div className="relative mb-6">
                <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="90" fill="#F3F4F6" />
                    <path d="M130 70 L150 50 M145 45 L135 55" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
                    {/* Abstract person */}
                    <circle cx="85" cy="85" r="25" fill="#E5E7EB" />
                    <path d="M60 140 C60 110, 110 110, 110 140" stroke="#E5E7EB" strokeWidth="20" strokeLinecap="round" />
                    {/* Magnifying glass */}
                    <circle cx="115" cy="85" r="20" stroke="#6B7280" strokeWidth="4" fill="none" />
                    <path d="M130 100 L150 120" stroke="#6B7280" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>
            <h3 className="text-gray-500 font-medium">{message}</h3>
        </div>
    )
}
