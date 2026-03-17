
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaymentState {
    processPayments: "manually" | "automatically";
    delayDays: string;
    proofOfPaymentEnabled: boolean;
    setProcessPayments: (value: "manually" | "automatically") => void;
    setDelayDays: (value: string) => void;
    setProofOfPaymentEnabled: (value: boolean) => void;
}

export const usePaymentStore = create<PaymentState>()(
    persist(
        (set) => ({
            processPayments: "manually",
            delayDays: "0",
            proofOfPaymentEnabled: true,
            setProcessPayments: (value) => set({ processPayments: value }),
            setDelayDays: (value) => set({ delayDays: value }),
            setProofOfPaymentEnabled: (value) => set({ proofOfPaymentEnabled: value }),
        }),
        {
            name: 'payment-settings-storage',
        }
    )
);
