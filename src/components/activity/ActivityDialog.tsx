// "use client"
// 
// import { useState } from "react"
// import { X } from "lucide-react"
// 
// interface ActivityDialogProps {
//     isOpen: boolean
//     onClose: () => void
// }
// 
// export function ActivityDialog({ isOpen, onClose }: ActivityDialogProps) {
//     const [activeTab, setActiveTab] = useState("basics")
// 
//     if (!isOpen) return null
// 
//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//             {/* Backdrop */}
//             <div
//                 className="absolute inset-0 bg-black/50"
//                 onClick={onClose}
//             />
// 
//             {/* Dialog */}
//             <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
//                 {/* Header */}
//                 <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
//                     <h2 className="text-2xl font-semibold text-slate-900">Activity in Hubstaff</h2>
//                     <button
//                         onClick={onClose}
//                         className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
//                     >
//                         <X className="h-6 w-6" />
//                     </button>
//                 </div>
// 
//                 {/* Content */}
//                 <div className="flex h-[calc(90vh-120px)]">
//                     {/* Sidebar */}
//                     <div className="w-56 border-r border-slate-200 bg-slate-50 p-6">
//                         <nav className="space-y-2">
//                             <button
//                                 onClick={() => setActiveTab("basics")}
//                                 className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "basics"
//                                     ? "bg-white text-slate-700 shadow-sm"
//                                     : "text-slate-600 hover:bg-white/50"
//                                     }`}
//                             >
//                                 The basics
//                             </button>
//                             <button
//                                 onClick={() => setActiveTab("timers")}
//                                 className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "timers"
//                                     ? "bg-white text-slate-700 shadow-sm"
//                                     : "text-slate-600 hover:bg-white/50"
//                                     }`}
//                             >
//                                 Timers
//                             </button>
//                             <button
//                                 onClick={() => setActiveTab("how-it-works")}
//                                 className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "how-it-works"
//                                     ? "bg-white text-slate-700 shadow-sm"
//                                     : "text-slate-600 hover:bg-white/50"
//                                     }`}
//                             >
//                                 How it works
//                             </button>
//                         </nav>
//                     </div>
// 
//                     {/* Main Content */}
//                     <div className="flex-1 overflow-y-auto p-6">
//                         {activeTab === "basics" && (
//                             <div className="space-y-6">
//                                 <p className="text-base text-slate-700">
//                                     Activity measures how active users are on their mouse and keyboard.
//                                 </p>
// 
//                                 <div className="space-y-4">
//                                     {/* 51-100% */}
//                                     <div className="flex items-start gap-4">
//                                         <div className="flex-shrink-0">
//                                             <span className="inline-flex items-center rounded-full bg-slate-600 px-4 py-1.5 text-sm font-semibold text-white">
//                                                 51-100%
//                                             </span>
//                                         </div>
//                                         <p className="text-sm text-slate-600 pt-1">
//                                             You're in the zone. Way to go!
//                                         </p>
//                                     </div>
// 
//                                     {/* 21-50% */}
//                                     <div className="flex items-start gap-4">
//                                         <div className="flex-shrink-0">
//                                             <span className="inline-flex items-center rounded-full bg-orange-400 px-4 py-1.5 text-sm font-semibold text-white">
//                                                 21-50%
//                                             </span>
//                                         </div>
//                                         <p className="text-sm text-slate-600 pt-1">
//                                             Depending on the work, this is a good range to be in.
//                                         </p>
//                                     </div>
// 
//                                     {/* 0-20% */}
//                                     <div className="flex items-start gap-4">
//                                         <div className="flex-shrink-0">
//                                             <span className="inline-flex items-center rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white">
//                                                 0-20%
//                                             </span>
//                                         </div>
//                                         <p className="text-sm text-slate-600 pt-1">
//                                             You're not very active on the computer.
//                                         </p>
//                                     </div>
// 
//                                     {/* Idle */}
//                                     <div className="flex items-start gap-4">
//                                         <div className="flex-shrink-0">
//                                             <span className="inline-flex items-center rounded-full bg-slate-500 px-4 py-1.5 text-sm font-semibold text-white">
//                                                 Idle
//                                             </span>
//                                         </div>
//                                         <div className="text-sm text-slate-600 pt-1">
//                                             <p>You weren't touching the mouse or keyboard at all.</p>
//                                             <a href="#" className="text-slate-700 hover:underline">
//                                                 Idle settings
//                                             </a>
//                                             {" "}can be customized for each team member.
//                                         </div>
//                                     </div>
//                                 </div>
// 
//                                 {/* Video Section */}
//                                 <div className="mt-8">
//                                     <h3 className="text-lg font-semibold text-slate-900 mb-4">
//                                         Welcome to activity video
//                                     </h3>
//                                     <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
//                                         <div className="absolute inset-0 flex items-center justify-center">
//                                             <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-900 shadow-lg hover:bg-blue-700 transition-colors cursor-pointer">
//                                                 <svg
//                                                     className="h-10 w-10 text-white ml-1"
//                                                     fill="currentColor"
//                                                     viewBox="0 0 24 24"
//                                                 >
//                                                     <path d="M8 5v14l11-7z" />
//                                                 </svg>
//                                             </div>
//                                         </div>
//                                         {/* Placeholder screenshots in background */}
//                                         <img
//                                             src="/Screenshoot/Screenshot 2026-01-20 161319.png"
//                                             alt="Video thumbnail"
//                                             className="h-full w-full object-cover opacity-50"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
// 
//                         {activeTab === "timers" && (
//                             <div className="space-y-6">
//                                 {/* Track Activity Section */}
//                                 <div>
//                                     <h3 className="text-base font-semibold text-slate-900 mb-4">
//                                         These timers <span className="font-bold">do track</span> activity
//                                     </h3>
// 
//                                     <div className="grid grid-cols-2 gap-4">
//                                         {/* Desktop Apps */}
//                                         <div className="rounded-lg bg-slate-50 p-4">
//                                             <p className="text-sm font-medium text-slate-600 mb-4">
//                                                 Desktop apps <span className="text-slate-400">(also record screenshots)</span>
//                                             </p>
//                                             <div className="grid grid-cols-4 gap-6">
//                                                 {/* Windows */}
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <svg className="h-12 w-12" viewBox="0 0 88 88" fill="#00ADEF">
//                                                             <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z" />
//                                                         </svg>
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">Windows</span>
//                                                 </div>
// 
//                                                 {/* Mac OS X */}
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <svg className="h-12 w-12" viewBox="0 0 24 24" fill="#555555">
//                                                             <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
//                                                         </svg>
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">Mac OS X</span>
//                                                 </div>
// 
//                                                 {/* Linux */}
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <img 
//                                                             src="/images/dashboard/linux.png" 
//                                                             alt="Linux" 
//                                                             className="h-12 w-12 object-contain"
//                                                         />
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">Linux</span>
//                                                 </div>
// 
//                                                 {/* Chromebook */}
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <svg className="h-12 w-12" viewBox="0 0 24 24">
//                                                             <circle cx="12" cy="12" r="10" fill="#4285F4" />
//                                                             <circle cx="12" cy="12" r="6" fill="#EA4335" />
//                                                             <circle cx="12" cy="12" r="3.5" fill="#FBBC04" />
//                                                             <circle cx="12" cy="12" r="2" fill="white" />
//                                                         </svg>
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">Chromebook</span>
//                                                 </div>
//                                             </div>
//                                         </div>
// 
//                                         {/* Browser Apps */}
//                                         <div className="rounded-lg bg-slate-50 p-4">
//                                             <p className="text-sm font-medium text-slate-600 mb-4">Browser apps</p>
//                                             <div className="flex justify-center">
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <svg className="h-12 w-12" viewBox="0 0 24 24">
//                                                             <circle cx="12" cy="12" r="10" fill="#4285F4" />
//                                                             <circle cx="12" cy="12" r="6" fill="#EA4335" />
//                                                             <circle cx="12" cy="12" r="3.5" fill="#FBBC04" />
//                                                             <circle cx="12" cy="12" r="2" fill="white" />
//                                                         </svg>
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">Chrome extension</span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
// 
//                                 {/* Do Not Track Activity Section */}
//                                 <div>
//                                     <h3 className="text-base font-semibold text-slate-900 mb-4">
//                                         These timers <span className="font-bold">do not track</span> activity
//                                     </h3>
// 
//                                     <div className="grid grid-cols-2 gap-4">
//                                         {/* Mobile Apps */}
//                                         <div className="rounded-lg bg-slate-50 p-4">
//                                             <p className="text-sm font-medium text-slate-600 mb-4">Mobile apps</p>
//                                             <div className="flex justify-center gap-8">
//                                                 {/* iOS */}
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <svg className="h-12 w-12" viewBox="0 0 24 24" fill="#555555">
//                                                             <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
//                                                         </svg>
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">iOS</span>
//                                                 </div>
// 
//                                                 {/* Android */}
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <div className="flex h-16 w-16 items-center justify-center">
//                                                         <svg className="h-12 w-12" viewBox="0 0 24 24" fill="#3DDC84">
//                                                             <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C2.99 11.01 1 14.88 1 19.05h22c0-4.17-1.99-8.04-5.4-9.57zM7.5 15.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
//                                                         </svg>
//                                                     </div>
//                                                     <span className="text-xs text-slate-600">Android</span>
//                                                 </div>
//                                             </div>
//                                         </div>
// 
//                                         {/* Web Timer */}
//                                         <div className="rounded-lg bg-slate-50 p-4">
//                                             <p className="text-sm font-medium text-slate-600 mb-4">Web timer</p>
//                                             <div className="flex flex-col items-center gap-3">
//                                                 <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm border border-slate-200">
//                                                     <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                                     </svg>
//                                                     <span className="text-lg font-mono text-slate-700">00:30:12</span>
//                                                     <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
//                                                     </svg>
//                                                 </div>
//                                                 <a href="#" className="text-sm text-slate-700 hover:underline">
//                                                     Web timer
//                                                 </a>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                         {activeTab === "how-it-works" && (
//                             <div className="space-y-4">
//                                 <h3 className="text-lg font-semibold text-slate-900">How it works</h3>
//                                 <p className="text-base text-slate-700">
//                                     Detailed information about how activity tracking works will be displayed here.
//                                 </p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
// 
//                 {/* Footer */}
//                 <div className="border-t border-slate-200 px-8 py-4 bg-slate-50">
//                     <div className="flex justify-end">
//                         <button
//                             onClick={onClose}
//                             className="rounded-lg bg-white border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }
// 
