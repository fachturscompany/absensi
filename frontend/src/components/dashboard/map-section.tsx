"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, X, Users, MapPin, Lock, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map component with no SSR to prevent window errors
const LeafletMap = dynamic(() => import("./dashboard-map-component"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
});

// ============== DUMMY DATA ==============
type RoleOption = {
    value: string;
    label: string;
};

type ProjectOption = {
    id: number;
    name: string;
};

type InviteFormData = {
    email: string;
    payRate: string;
    currency: string;
    role: string;
    projects: number[];
};

type JobsiteFormData = {
    name: string;
    address: string;
    radius: string;
    latitude: string;
    longitude: string;
};

const DUMMY_ROLES: RoleOption[] = [
    { value: "user", label: "User" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" },
    { value: "viewer", label: "Viewer" },
];

const DUMMY_PROJECTS: ProjectOption[] = [
    { id: 1, name: "Website Revamp" },
    { id: 2, name: "Mobile App Development" },
    { id: 3, name: "Data Migration" },
    { id: 4, name: "API Integration" },
    { id: 5, name: "UI/UX Redesign" },
];

const DUMMY_CURRENCIES = ["IDR/hr", "USD/hr", "EUR/hr", "SGD/hr"];

// ============== COMPONENTS ==============

// Invite Members Dialog Component - Monochrome theme
function InviteMembersDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const MAX_INVITES = 5;
    const [activeTab, setActiveTab] = useState<"send" | "create">("send");
    const [invites, setInvites] = useState<InviteFormData[]>([
        { email: "", payRate: "", currency: "IDR/hr", role: "user", projects: [] },
    ]);
    const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

    const addInvite = () => {
        if (invites.length < MAX_INVITES) {
            setInvites([
                ...invites,
                { email: "", payRate: "", currency: "IDR/hr", role: "user", projects: [] },
            ]);
        }
    };

    const removeInvite = (index: number) => {
        if (invites.length > 1) {
            setInvites(invites.filter((_, i) => i !== index));
        }
    };

    const updateInvite = <T extends keyof InviteFormData>(
        index: number,
        field: T,
        value: InviteFormData[T]
    ) => {
        const updated = [...invites];
        updated[index] = { ...updated[index], [field]: value } as InviteFormData;
        setInvites(updated);
    };

    const toggleProject = (projectId: number) => {
        setSelectedProjects((prev) =>
            prev.includes(projectId)
                ? prev.filter((id) => id !== projectId)
                : [...prev, projectId]
        );
    };

    const selectAllProjects = () => {
        setSelectedProjects(DUMMY_PROJECTS.map((p) => p.id));
    };

    const handleSend = () => {
        console.log("Sending invites:", invites, "Projects:", selectedProjects);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col shadow-md">
                <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-xl font-semibold text-gray-900">Add members</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "send" | "create")} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 pt-5 shrink-0">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="send">Send invites</TabsTrigger>
                            <TabsTrigger value="create">Create accounts</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab: Send Invites */}
                    <TabsContent value="send" className="flex-1 overflow-y-auto m-0">
                        <div className="p-6 pt-5 space-y-6">
                            <p className="text-sm font-medium text-gray-600">Invite via email</p>

                            {/* Scrollable Invites Container - Custom Scrollbar */}
                            <div className="space-y-6 max-h-[500px] overflow-y-auto overflow-x-hidden pl-3 pr-2 invite-scrollbar">
                                {invites.map((invite, index) => (
                                    <div key={index} className="flex flex-row gap-2 items-end w-full animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Email Input - Flexible Width */}
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Email*</Label>
                                            <Input
                                                type="email"
                                                placeholder="Add an email"
                                                value={invite.email}
                                                onChange={(e) => updateInvite(index, "email", e.target.value)}
                                                className="h-10 w-full shadow-sm"
                                            />
                                        </div>

                                        {/* Pay Rate Input - Fixed Width */}
                                        <div className="w-[200px] space-y-1.5 shrink-0">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pay Rate</Label>
                                            <div className="relative flex items-center h-10 w-full rounded-md border border-input bg-background shadow-sm focus-within:z-10 focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring transition-all">
                                                <Input
                                                    type="text"
                                                    placeholder="Pay rate"
                                                    value={invite.payRate}
                                                    onChange={(e) => updateInvite(index, "payRate", e.target.value)}
                                                    className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-full rounded-none shadow-none text-sm px-3 min-w-0"
                                                />
                                                <div className="h-full bg-transparent border-l border-input flex items-center shrink-0">
                                                    <Select
                                                        value={invite.currency}
                                                        onValueChange={(v) => updateInvite(index, "currency", v)}
                                                    >
                                                        <SelectTrigger className="h-full border-none bg-transparent focus:ring-0 shadow-none gap-1 px-2 w-[85px] text-muted-foreground font-medium hover:text-foreground">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent align="end">
                                                            {DUMMY_CURRENCIES.map((c) => (
                                                                <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove Button - Inline */}
                                        {invites.length > 1 && (
                                            <div className="w-10 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => removeInvite(index)}
                                                    className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer rounded-full transition-colors"
                                                    title="Remove invite"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addInvite}
                                disabled={invites.length >= MAX_INVITES}
                                className={`text-sm font-medium transition-colors ${invites.length >= MAX_INVITES
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : "text-primary hover:text-primary/80 cursor-pointer"
                                    }`}
                            >
                                + Invite another
                            </button>



                            {/* Role Selection */}
                            <div className="space-y-3 pt-2">
                                <div className="space-y-2 w-[200px]">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Role*</Label>
                                        <a href="#" className="text-xs text-primary hover:underline font-medium">Learn more</a>
                                    </div>
                                    <Select defaultValue="user">
                                        <SelectTrigger className="h-10 border-gray-300">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DUMMY_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Projects Selection */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                        Projects <span className="text-gray-400 text-[10px]">ⓘ</span>
                                    </Label>
                                    <button
                                        onClick={selectAllProjects}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Select all
                                    </button>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3 min-h-[44px] bg-gray-50/50">
                                    {selectedProjects.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Select projects you want to add team members to
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {DUMMY_PROJECTS.filter((p) => selectedProjects.includes(p.id)).map((p) => (
                                                <span
                                                    key={p.id}
                                                    className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium"
                                                >
                                                    {p.name}
                                                    <X
                                                        className="w-3.5 h-3.5 cursor-pointer hover:bg-primary/80 rounded-full"
                                                        onClick={() => toggleProject(p.id)}
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Project Options */}
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {DUMMY_PROJECTS.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center gap-2 space-x-2 rounded-lg border p-2 hover:bg-accent transition-colors cursor-pointer"
                                            onClick={() => toggleProject(project.id)}
                                        >
                                            <Checkbox
                                                id={`project-${project.id}`}
                                                checked={selectedProjects.includes(project.id)}
                                                onCheckedChange={() => toggleProject(project.id)}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <label
                                                htmlFor={`project-${project.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                                            >
                                                {project.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <a href="#" className="text-primary text-sm font-medium hover:underline">
                                    Or invite via link
                                </a>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Create Accounts */}
                    <TabsContent value="create" className="p-6 pt-4 space-y-4 m-0">
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Lock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-gray-900">Upgrade to use Account provisioning</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    With Account provisioning, you can create accounts for your team members
                                    individually or in bulk. Skip the hassle of invites and directly create member
                                    logins, passwords, and even set whether they receive emails.
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs">
                                        View plans & add-ons
                                    </Button>
                                    <a href="#" className="text-xs text-primary hover:underline font-medium">
                                        Learn more
                                    </a>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="p-6 pt-4 border-t flex-row justify-between sm:justify-between gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend}>
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Add Jobsite Dialog Component
function AddJobsiteDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [formData, setFormData] = useState<JobsiteFormData>({
        name: "",
        address: "",
        radius: "100",
        latitude: "",
        longitude: "",
    });

    const updateField = (field: keyof JobsiteFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        console.log("Saving jobsite:", formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">Add job site</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Site Name */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Site Name*</Label>
                        <Input
                            type="text"
                            placeholder="e.g., Kantor Pusat Jakarta"
                            value={formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            className="h-10"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Address</Label>
                        <Input
                            type="text"
                            placeholder="Search for an address..."
                            value={formData.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            className="h-10"
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Latitude</Label>
                            <Input
                                type="text"
                                placeholder="-6.2088"
                                value={formData.latitude}
                                onChange={(e) => updateField("latitude", e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Longitude</Label>
                            <Input
                                type="text"
                                placeholder="106.8456"
                                value={formData.longitude}
                                onChange={(e) => updateField("longitude", e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* Radius */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Geofence Radius (meters)</Label>
                        <Select value={formData.radius} onValueChange={(v) => updateField("radius", v)}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="50">50 meters</SelectItem>
                                <SelectItem value="100">100 meters</SelectItem>
                                <SelectItem value="200">200 meters</SelectItem>
                                <SelectItem value="500">500 meters</SelectItem>
                                <SelectItem value="1000">1 kilometer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mini Map Preview */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Location Preview</Label>
                        <div className="w-full h-40 bg-muted/30 rounded-lg border flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Enter coordinates to preview location</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 border-t flex-row justify-between sm:justify-between gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Job Site
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Floating Action Button with Menu - Hubstaff-style simple design
function FloatingActionMenu({
    onInviteMembers,
    onAddJobsite,
}: {
    onInviteMembers: () => void;
    onAddJobsite: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute right-4 top-4 z-[400] flex flex-col items-end">
            {/* Main FAB Button - Black primary color */}
            <Button
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={`rounded-full h-10 w-10 shadow-md transition-all duration-200 ${isOpen
                    ? "bg-black hover:bg-black/90 text-white"
                    : "bg-black hover:bg-black/80 text-white"
                    }`}
            >
                <div className={`transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                    {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
            </Button>

            {/* Dropdown Menu - Simple Hubstaff-style */}
            {isOpen && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-w-[180px]">
                        <button
                            onClick={() => {
                                onInviteMembers();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Invite members</span>
                        </button>

                        <button
                            onClick={() => {
                                onAddJobsite();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Add job site</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============== MAIN COMPONENT ==============
export default function DashboardMap() {
    const [inviteMembersOpen, setInviteMembersOpen] = useState(false);
    const [addJobsiteOpen, setAddJobsiteOpen] = useState(false);

    // Dummy stats
    const activeMembers = 0;
    const activeJobsites = 0;

    return (
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden border shadow-sm group">
            <LeafletMap />

            {/* Overlay: Center "No active members" Card */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <Card className="w-[280px] shadow-lg bg-white/95 backdrop-blur-sm pointer-events-auto">
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-900">No active members or job sites</h3>
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            Enable map
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Floating Action Menu */}
            <FloatingActionMenu
                onInviteMembers={() => setInviteMembersOpen(true)}
                onAddJobsite={() => setAddJobsiteOpen(true)}
            />

            {/* Overlay: Bottom Right Stats */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
                <Card className="shadow-lg bg-white/95 backdrop-blur-sm pointer-events-auto min-w-[240px]">
                    <CardContent className="p-4 grid grid-cols-2 divide-x">
                        <div className="px-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{activeMembers}</div>
                            <div className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center justify-center gap-1">
                                Active members
                                <ChevronDown className="w-3 h-3" />
                            </div>
                        </div>
                        <div className="px-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{activeJobsites}</div>
                            <div className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center justify-center gap-1">
                                Active job sites
                                <ChevronDown className="w-3 h-3" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <InviteMembersDialog open={inviteMembersOpen} onOpenChange={setInviteMembersOpen} />
            <AddJobsiteDialog open={addJobsiteOpen} onOpenChange={setAddJobsiteOpen} />
        </div>
    );
}
