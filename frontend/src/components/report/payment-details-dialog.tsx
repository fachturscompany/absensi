
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PaymentEntry } from "@/lib/data/dummy-data"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Clock,
    CreditCard,
    Calendar,
    AlertCircle,
    Briefcase,
    Receipt
} from "lucide-react"

interface PaymentDetailsDialogProps {
    payment: PaymentEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export function PaymentDetailsDialog({ payment, open, onOpenChange }: PaymentDetailsDialogProps) {
    if (!payment) return null

    const getStatusColor = (_: string) => {
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Payment Details
                                <Badge variant="outline" className={getStatusColor(payment.status)}>
                                    {payment.status}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 flex items-center gap-2">
                                <span className="font-medium text-foreground">{payment.id}</span>
                                <span>•</span>
                                <Calendar className="w-4 h-4" />
                                {new Date(payment.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-100px)]">
                    <div className="p-6 space-y-8">
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" /> Work Summary
                                </h3>
                                <div className="space-y-3 pl-6 border-l-2 border-muted">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Total Hours</span>
                                        <span className="font-medium">{payment.hours.toFixed(2)} hrs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Hourly Rate</span>
                                        <span className="font-medium">{formatCurrency(payment.rate)}/hr</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="w-4 h-4" /> Payment Info
                                </h3>
                                <div className="space-y-3 pl-6 border-l-2 border-muted">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Method</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {payment.method}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="text-sm">{payment.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Project Breakdown */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                <Briefcase className="w-4 h-4" /> Project Breakdown
                            </h3>
                            {payment.projectsBreakdown && payment.projectsBreakdown.length > 0 ? (
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="p-0">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr className="border-b">
                                                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Project / Task</th>
                                                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Hours</th>
                                                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payment.projectsBreakdown.map((item, idx) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                        <td className="p-4 align-middle font-medium">{item.name}</td>
                                                        <td className="p-4 align-middle text-right">{item.hours.toFixed(2)}</td>
                                                        <td className="p-4 align-middle text-right">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md text-center">
                                    No detailed project breakdown available for this payment.
                                </div>
                            )}
                        </div>

                        {/* Detailed Calculation */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                <Receipt className="w-4 h-4" /> Financial Breakdown
                            </h3>
                            <div className="rounded-lg border bg-gray-50/50 p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">Fixed Pay</span>
                                    <span>{formatCurrency(payment.fixedAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">PTO & Holidays</span>
                                    <span>{formatCurrency(payment.ptoAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">Additions</span>
                                    <span>+ {formatCurrency(payment.additions)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">Bonus</span>
                                    <span>+ {formatCurrency(payment.bonus)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">Deductions</span>
                                    <span>- {formatCurrency(payment.deductions)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total Amount</span>
                                    <span>{formatCurrency(payment.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {payment.notes && (
                            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                                <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-1 text-sm">
                                    <AlertCircle className="w-4 h-4" /> Notes
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {payment.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    {/* Can add footer actions here later like Download PDF */}
                </div>
            </DialogContent>
        </Dialog>
    )
}
