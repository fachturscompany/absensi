"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Building2, 
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface PendingApprovalProps {
  organizationName: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function PendingApproval({ 
  organizationName, 
  onRefresh, 
  isRefreshing = false 
}: PendingApprovalProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-xl">
                <Clock className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Pending Approval</CardTitle>
            <CardDescription className="text-gray-300">
              Your organization is waiting for admin approval
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Organization Info */}
            <div className="bg-gray-700/50 border border-gray-600 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-5 w-5 text-gray-300" />
                <span className="font-medium text-white">Organization</span>
              </div>
              <p className="text-white font-semibold text-lg mb-3">{organizationName}</p>
              <div className="flex items-center gap-2">
                <Badge className="text-amber-200 bg-amber-500/20 border-amber-500/30">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              </div>
            </div>

            {/* Status Steps */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Organization Created</p>
                  <p className="text-xs text-gray-300">Your organization has been successfully created</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                  <Clock className="h-5 w-5 text-amber-400 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Admin Review</p>
                  <p className="text-xs text-gray-300">Waiting for system administrator approval</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600">
                  <div className="h-3 w-3 bg-gray-500 rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-400">Organization Active</p>
                  <p className="text-xs text-gray-500">Access granted after approval</p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-black/10 border border-blue-500/20 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-blue-300">What happens next?</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  System admin will review your organization
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  You&apos;ll receive email notification once approved
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  Full access will be granted immediately
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  You can start inviting team members
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {onRefresh && (
                <Button 
                  variant="outline" 
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="w-full bg-transparent border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </>
                  )}
                </Button>
              )}
              
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Need help? Contact your system administrator
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
