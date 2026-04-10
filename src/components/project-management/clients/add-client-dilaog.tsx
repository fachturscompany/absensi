import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DUMMY_TEAMS } from "@/lib/data/dummy-data"

interface AddClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (client: ClientFormData) => void
    initialData?: ClientFormData
}

export interface ClientFormData {
    name: string
    address: string
    phone: string
    phoneCountry: string
    emails: string
    teams: string[]
    budgetType: string
    budgetBasedOn: string
    budgetCost: string
    budgetNotifyAt: string
    budgetResets: string
    startDate: string
    budgetIncludeNonBillable: boolean
    invoiceNotesCustom: boolean
    invoiceNotes: string
    invoiceNetTermsCustom: boolean
    invoiceNetTerms: string
    invoiceTaxRateCustom: boolean
    invoiceTaxRate: string
    autoInvoicing: "off" | "custom"
    aiAmountBasedOn: "hourly" | "fixed"
    aiFixedPrice: string
    aiFrequency: string
    aiDelaySending: string
    aiSendReminder: string
    aiLineItems: string
    aiIncludeNonBillable: boolean
    aiIncludeExpenses: boolean
}

const defaultForm: ClientFormData = {
    name: "",
    address: "",
    phone: "",
    phoneCountry: "id",
    emails: "",
    teams: [],
    budgetType: "",
    budgetBasedOn: "",
    budgetCost: "",
    budgetNotifyAt: "80",
    budgetResets: "never",
    startDate: "",
    budgetIncludeNonBillable: false,
    invoiceNotesCustom: false,
    invoiceNotes: "",
    invoiceNetTermsCustom: false,
    invoiceNetTerms: "30",
    invoiceTaxRateCustom: false,
    invoiceTaxRate: "",
    autoInvoicing: "off",
    aiAmountBasedOn: "hourly",
    aiFixedPrice: "",
    aiFrequency: "monthly",
    aiDelaySending: "0",
    aiSendReminder: "0",
    aiLineItems: "user-project-date",
    aiIncludeNonBillable: false,
    aiIncludeExpenses: false,
}

export function AddClientDialog({ open, onOpenChange, onSave, initialData }: AddClientDialogProps) {
    const [formData, setFormData] = useState<ClientFormData>(initialData || defaultForm)

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert("Name is required")
            return
        }
        onSave(formData)
        onOpenChange(false)
    }

    const handleCancel = () => {
        setFormData(initialData || defaultForm)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-6 md:p-8">
                <DialogHeader>
                    <DialogTitle>New client</DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-6 mb-4">
                        <TabsTrigger value="general">GENERAL</TabsTrigger>
                        <TabsTrigger value="contact">INFO</TabsTrigger>
                        <TabsTrigger value="teams">TEAMS</TabsTrigger>
                        <TabsTrigger value="budget">BUDGET</TabsTrigger>
                        <TabsTrigger value="invoicing">INVOICING</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 pt-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">NAME<span className="text-red-500">*</span></Label>
                            <Input id="name" placeholder="e.g. Acme Corp" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">ADDRESS</Label>
                            <Textarea id="address" placeholder="e.g. 123 Business Rd, Jakarta, Indonesia" rows={5} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 pt-5">
                        <div className="space-y-2">
                            <Label htmlFor="phone">PHONE NUMBER</Label>
                            <div className="flex gap-3 md:gap-4">
                                <Select value={formData.phoneCountry} onValueChange={(value) => setFormData({ ...formData, phoneCountry: value })}>
                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id">🇮🇩</SelectItem>
                                        <SelectItem value="us">🇺🇸</SelectItem>
                                        <SelectItem value="gb">🇬🇧</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input id="phone" placeholder="+62 812-345-678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="flex-1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emails">EMAIL ADDRESSES</Label>
                            <Input id="emails" placeholder="e.g. contact@acme.com, billing@acme.com" value={formData.emails} onChange={(e) => setFormData({ ...formData, emails: e.target.value })} />
                        </div>
                    </TabsContent>



                    <TabsContent value="teams" className="space-y-6 pt-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold text-muted-foreground">TEAMS</div>
                                <Button variant="link" className="h-auto p-0 text-gray-900 hover:cursor-pointer" onClick={() => setFormData({ ...formData, teams: DUMMY_TEAMS.map(t => t.id) })}>
                                    Select all
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                            <div className="space-y-4">
                                {DUMMY_TEAMS.map((team) => (
                                    <div key={team.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`team-${team.id}`}
                                            checked={formData.teams.includes(team.id)}
                                            onCheckedChange={(checked) => {
                                                const newTeams = checked ? [...formData.teams, team.id] : formData.teams.filter(t => t !== team.id)
                                                setFormData({ ...formData, teams: newTeams })
                                            }}
                                        />
                                        <label htmlFor={`team-${team.id}`} className="text-sm leading-none">
                                            {team.name} <span className="text-muted-foreground">({team.memberCount} members)</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="budget" className="space-y-6 pt-5">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">TYPE*</label>
                                <Select value={formData.budgetType} onValueChange={(v) => setFormData({ ...formData, budgetType: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hours">Hours</SelectItem>
                                        <SelectItem value="cost">Cost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">BASED ON*</label>
                                <Select value={formData.budgetBasedOn} onValueChange={(v) => setFormData({ ...formData, budgetBasedOn: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select a rate" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tracked-time">Tracked Time</SelectItem>
                                        <SelectItem value="billable-time">Billable Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">COST*</label>
                                <div className="flex">
                                    <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 rounded-l-md text-sm text-gray-600">$</div>
                                    <Input type="number" placeholder="0.0" value={formData.budgetCost} onChange={(e) => setFormData({ ...formData, budgetCost: e.target.value })} className="rounded-l-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">NOTIFY AT</label>
                                <div className="flex gap-2">
                                    <Input type="number" value={formData.budgetNotifyAt} onChange={(e) => setFormData({ ...formData, budgetNotifyAt: e.target.value })} className="flex-1" />
                                    <div className="flex items-center px-3 bg-gray-100 border rounded-md text-sm text-muted-foreground">% of budget</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">RESETS*</label>
                                <Select value={formData.budgetResets} onValueChange={(v) => setFormData({ ...formData, budgetResets: v })}>
                                    <SelectTrigger><SelectValue placeholder="Never" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="never">Never</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">START DATE <span className="text-gray-400">ⓘ</span></label>
                                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="include-non-billable" checked={formData.budgetIncludeNonBillable} onCheckedChange={(v) => setFormData({ ...formData, budgetIncludeNonBillable: v })} />
                            <Label htmlFor="include-non-billable" className="text-sm font-normal text-muted-foreground">Include non-billable time</Label>
                        </div>
                    </TabsContent>

                    <TabsContent value="invoicing" className="space-y-6 pt-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Notes (shown on invoices)</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch id="custom-notes" checked={formData.invoiceNotesCustom} onCheckedChange={(v) => setFormData({ ...formData, invoiceNotesCustom: v })} />
                                    <Label htmlFor="custom-notes" className="text-sm font-medium">Custom for this client</Label>
                                </div>
                                {formData.invoiceNotesCustom && (
                                    <Textarea placeholder="Enter notes to client" value={formData.invoiceNotes} onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })} className="mt-2" />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">NET TERMS <span className="text-gray-400">ⓘ</span></label>
                                    <div className="flex items-center gap-2">
                                        <Switch id="custom-net-terms" checked={formData.invoiceNetTermsCustom} onCheckedChange={(v) => setFormData({ ...formData, invoiceNetTermsCustom: v })} />
                                        <Label htmlFor="custom-net-terms" className="text-sm font-medium">Custom for this client</Label>
                                    </div>
                                    {formData.invoiceNetTermsCustom && (
                                        <div className="flex gap-2">
                                            <Input type="number" value={formData.invoiceNetTerms} onChange={(e) => setFormData({ ...formData, invoiceNetTerms: e.target.value })} className="flex-1" />
                                            <div className="flex items-center px-4 bg-gray-100 border rounded-md text-sm text-foreground">days</div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">TAX RATE <span className="text-gray-400">ⓘ</span></label>
                                    <div className="flex items-center gap-2">
                                        <Switch id="custom-tax-rate" checked={formData.invoiceTaxRateCustom} onCheckedChange={(v) => setFormData({ ...formData, invoiceTaxRateCustom: v })} />
                                        <Label htmlFor="custom-tax-rate" className="text-sm font-medium">Custom for this client</Label>
                                    </div>
                                    {formData.invoiceTaxRateCustom && (
                                        <div className="flex gap-2">
                                            <Input type="number" placeholder="Ex. 7" value={formData.invoiceTaxRate} onChange={(e) => setFormData({ ...formData, invoiceTaxRate: e.target.value })} className="flex-1" />
                                            <div className="flex items-center px-4 bg-gray-100 border rounded-md text-sm text-foreground">%</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-base font-semibold">Auto invoicing</label>
                                <div className="flex rounded-full bg-gray-100 p-1 w-fit">
                                    <button onClick={() => setFormData({ ...formData, autoInvoicing: "off" })} className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${formData.autoInvoicing === "off" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Off</button>
                                    <button onClick={() => setFormData({ ...formData, autoInvoicing: "custom" })} className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${formData.autoInvoicing === "custom" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Custom</button>
                                </div>
                                <Button variant="link" className="h-auto p-0 text-gray-900 hover:cursor-pointer text-sm font-normal">Set up auto-invoicing for all your clients at once.</Button>
                            </div>

                            {formData.autoInvoicing === "custom" && (
                                <div className="space-y-6 pt-2 border-t mt-4 border-gray-100">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Amount based on</label>
                                            <RadioGroup value={formData.aiAmountBasedOn} onValueChange={(v: "hourly" | "fixed") => setFormData({ ...formData, aiAmountBasedOn: v })} className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="hourly" id="ai-hourly" />
                                                    <Label htmlFor="ai-hourly" className="font-normal flex gap-1 items-center">Hourly <span className="text-gray-400 cursor-help" title="Info">ⓘ</span></Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="fixed" id="ai-fixed" />
                                                    <Label htmlFor="ai-fixed" className="font-normal">Fixed price</Label>
                                                    {formData.aiAmountBasedOn === "fixed" && (
                                                        <div className="flex items-center ml-2">
                                                            <Input type="number" value={formData.aiFixedPrice} onChange={(e) => setFormData({ ...formData, aiFixedPrice: e.target.value })} className="w-24 h-8" />
                                                            <div className="flex items-center px-3 h-8 bg-gray-100 border border-l-0 rounded-r-md text-xs text-foreground">USD</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">Frequency</label>
                                            <Select value={formData.aiFrequency} onValueChange={(v) => setFormData({ ...formData, aiFrequency: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">Delay sending <span className="text-gray-400 cursor-help">ⓘ</span></label>
                                            <div className="flex gap-0">
                                                <Input type="number" value={formData.aiDelaySending} onChange={(e) => setFormData({ ...formData, aiDelaySending: e.target.value })} className="rounded-r-none" />
                                                <div className="flex items-center px-4 bg-gray-100 border border-l-0 rounded-r-md text-sm text-foreground">days</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">Send reminder after due <span className="text-gray-400 cursor-help">ⓘ</span></label>
                                            <div className="flex gap-0">
                                                <Input type="number" value={formData.aiSendReminder} onChange={(e) => setFormData({ ...formData, aiSendReminder: e.target.value })} className="rounded-r-none" />
                                                <div className="flex items-center px-4 bg-gray-100 border border-l-0 rounded-r-md text-sm text-foreground">days</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Select value={formData.aiLineItems} onValueChange={(v) => setFormData({ ...formData, aiLineItems: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select line items" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user-date">By user and date</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Switch id="ai-include-non-billable" checked={formData.aiIncludeNonBillable} onCheckedChange={(v) => setFormData({ ...formData, aiIncludeNonBillable: v })} />
                                            <Label htmlFor="ai-include-non-billable" className="font-normal text-muted-foreground">Include non-billable time</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch id="ai-include-expenses" checked={formData.aiIncludeExpenses} onCheckedChange={(v) => setFormData({ ...formData, aiIncludeExpenses: v })} />
                                            <Label htmlFor="ai-include-expenses" className="font-normal text-muted-foreground">Include expenses</Label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}