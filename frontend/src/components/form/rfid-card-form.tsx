"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

export const rfidSchema = z.object({
  card_number: z.string().min(2, "Card number minimal 2 karakter"),
  card_type: z.string().optional(),
})

export type RfidFormValues = z.infer<typeof rfidSchema>

export default function RfidCardForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<RfidFormValues>
  onSubmit: (values: RfidFormValues) => void
}) {
  const form = useForm<RfidFormValues>({
    resolver: zodResolver(rfidSchema),
    defaultValues: {
      card_number: initialValues?.card_number || "",
      card_type: initialValues?.card_type || "",
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="space-y-4 border p-4 rounded-md"
      >
        <FormField
          control={form.control}
          name="card_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter card number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="card_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Type</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter card type" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save RFID</Button>
      </form>
    </Form>
  )
}
