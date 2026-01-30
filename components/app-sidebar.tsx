"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { GalleryVerticalEnd, Minus, Plus } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// ----------------------
// Types
// ----------------------
type NavItem = {
  title: string;
  url: string;
};

type NavSection = {
  title: string;
  url: string;
  allowedRoles?: string[];
  items?: NavItem[];
};

// ----------------------
// Role-based nav config
// ----------------------
const data: { navMain: NavSection[] } = {
  navMain: [
    {
      title: "Getting Started",
      url: "/getting-started",
      allowedRoles: ["owner", "admin", "user"],
      items: [
        { title: "Installation", url: "/installation" },
        { title: "Project Structure", url: "/structure" },
      ],
    },

    {
      title: "Building Your Application",
      url: "/building",
      allowedRoles: ["owner", "admin"],
      items: [
        { title: "Routing", url: "/routing" },
        { title: "Data Fetching", url: "/data" },
        { title: "Rendering", url: "/rendering" },
      ],
    },
    {
      title: "API Reference",
      url: "/api",
      allowedRoles: ["owner", "admin"],
      items: [
        { title: "Components", url: "/components" },
        { title: "CLI", url: "/cli" },
      ],
    },
    {
      title: "Architecture",
      url: "/architecture",
      allowedRoles: ["owner"], // 👈 only owners see this
      items: [
        { title: "Accessibility", url: "/accessibility" },
        { title: "Turbopack", url: "/turbopack" },
      ],
    },
    {
      title: "Community",
      url: "/community",
      allowedRoles: ["owner", "admin", "user"],
      items: [{ title: "Contribution Guide", url: "/contribute" }],
    },
    {
      title: "Inventory",
      url: "/inventory",
      allowedRoles: ["owner"], // 👈 only owners see this
      items: [{ title: "All Inventory", url: "/inventory" }],
    },
    {
      title: "Orders",
      url: "/orders",
      allowedRoles: ["owner"], // 👈 only owners see this
      items: [{ title: "Purchase Orders", url: "/purchase-order" }],
    },
    {
      title: "Vendors",
      url: "/vendors",
      allowedRoles: ["owner"], // 👈 only owners see this
      items: [
        { title: "All Vendors", url: "/all-vendors" },
        { title: "Vendor Product Codes", url: "/vendor-product-codes" },
        { title: "Vendor Hardware Codes", url: "/vendor-hardware-codes" },
      ],
    },
  ],
};

// ----------------------
// Component
// ----------------------
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const pathname = usePathname();
  const role = (user?.publicMetadata?.role as string) ?? "user";

  // Filter based on allowedRoles
  const navItems = data.navMain.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(role)
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">NovaFlow</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 0}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.title}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
