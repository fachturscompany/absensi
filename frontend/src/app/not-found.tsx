"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const sidebar = document.querySelector('[data-sidebar]') || document.querySelector('aside');
    const navbar = document.querySelector('[data-navbar]') || document.querySelector('nav');
    
    if (sidebar instanceof HTMLElement) sidebar.style.display = 'none';
    if (navbar instanceof HTMLElement) navbar.style.display = 'none';
    
    document.body.style.marginLeft = '0';
    
    return () => {
      if (sidebar instanceof HTMLElement) sidebar.style.display = '';
      if (navbar instanceof HTMLElement) navbar.style.display = '';
      document.body.style.marginLeft = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen bg-background flex items-center justify-center px-4 z-50">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* 404 Illustration */}
        <div className="relative animate-bounce-slow">
          <div className="text-8xl font-bold text-muted-foreground/20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-muted-foreground/40 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Please check the URL or return to the dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          
          <Link href="/">
            <Button className="flex items-center gap-2 w-full sm:w-auto hover:scale-105 transition-transform duration-200 bg-primary hover:bg-primary/90">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Need help? Contact your system administrator
          </p>
          
          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <Link 
              href="/members" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Members
            </Link>
            <Link 
              href="/attendance" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Attendance
            </Link>
            <Link 
              href="/organization" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Organization
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/60">
          Error Code: 404 - Page Not Found
        </div>
      </div>
    </div>
  );
}
