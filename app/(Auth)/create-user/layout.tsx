"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ReactNode } from "react";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface NavigationLayoutProps {
  children: ReactNode;
  pageName?: string;
}

export default function NavigationLayout({
  children,
  pageName,
}: NavigationLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 w-full items-center border-b px-4 justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>

          {/* Page name in center */}
          {pageName && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-lg font-semibold">{pageName}</h1>
            </div>
          )}

          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <AnimatedThemeToggler className="pr-4" />
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>

        {/* Page content gets rendered here */}
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
