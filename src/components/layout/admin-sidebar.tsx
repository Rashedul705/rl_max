
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { LayoutDashboard, ShoppingCart, Package, FileText, Home, Tags, Truck, MessageSquare } from "lucide-react";
import { Sidebar, SidebarClose } from "@/components/ui/sidebar";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/admin/products", label: "Products", icon: <Package /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingCart /> },
  { href: "/admin/categories", label: "Categories", icon: <Tags /> },
  { href: "/admin/shipping", label: "Shipping", icon: <Truck /> },
  { href: "/admin/inquiries", label: "Inquiries", icon: <MessageSquare /> },
  { href: "/admin/content", label: "Content", icon: <FileText /> },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="">Admin Panel</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {adminNavItems.map((item) => (
              <SidebarClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                      ? 'bg-muted text-primary'
                      : ''
                  }`}
                >
                  {React.cloneElement(item.icon, { className: "h-4 w-4" })}
                  {item.label}
                </Link>
              </SidebarClose>
            ))}
          </nav>
        </div>
         <div className="mt-auto p-4">
            <SidebarClose asChild>
                <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                <Home className="h-4 w-4" />
                Storefront
                </Link>
            </SidebarClose>
        </div>
      </div>
    </Sidebar>
  );
}
