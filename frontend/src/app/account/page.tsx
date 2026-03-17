import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAccountData } from "@/action/account";
import { AccountForm } from "@/components/form/account-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function AccountPage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Get account data
  const accountResult = await getAccountData();
  
  if (!accountResult.success || !accountResult.data) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accountResult.message || "Failed to load account data. Please try again."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <div className="w-full py-6 px-4 md:px-6">
        <AccountForm initialData={accountResult.data} />
      </div>
    </div>
  );
}
