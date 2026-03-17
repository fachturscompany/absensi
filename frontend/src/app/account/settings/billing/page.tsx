

import { Button } from "@/components/ui/button"

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Free Plan</p>
                            <p className="text-sm text-muted-foreground">
                                You are currently on the free plan.
                            </p>
                        </div>
                        <Button variant="outline">Upgrade Plan</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Payment Method</h4>
                    <p className="text-sm text-muted-foreground">
                        No payment method on file.
                    </p>
                    <Button variant="link" className="px-0 h-auto text-black">
                        Add payment method
                    </Button>
                </div>
            </div>
        </div>
    )
}
