"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFileDescription,
  IconFileInvoice,
  IconHelp,
  IconHome,
  IconSearch,
  IconSettings,
  IconMap,
  IconTags,
  IconSeo,
  IconUsers,
  IconStar,
  IconFileText,
  IconClipboardList,
} from "@tabler/icons-react"
import Image from "next/image"

import { NavDocuments } from "@/app/(dashboard)/_components/nav-documents"
import { NavMain } from "@/app/(dashboard)/_components/nav-main"
import { NavSecondary } from "@/app/(dashboard)/_components/nav-secondary"
import { NavUser } from "@/app/(dashboard)/_components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"

const data = {
  navMain: [
    {
      title: "Gösterge Paneli",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Villa Yönetimi",
      url: "/admin/villas",
      icon: IconHome,
    },
    {
      title: "Rezervasyon Yönetimi",
      url: "/admin/reservations",
      icon: IconClipboardList,
    },
    {
      title: "Müşteri Yönetimi",
      url: "/admin/customers",
      icon: IconUsers,
    },
    {
      title: "İnceleme & Yorumlar",
      url: "/admin/reviews",
      icon: IconStar,
    },
    {
      title: "Villa SEO",
      url: "/admin/villaSEO",
      icon: IconSeo,
    },
    {
      title: "Etiket Yönetimi",
      url: "/admin/tags",
      icon: IconTags,
    },
    {
      title: "Bölge Yönetimi",
      url: "/admin/regions",
      icon: IconMap,
    },
  ],
  navSecondary: [
    {
      title: "Ayarlar",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Yardım Al",
      url: "/admin/help",
      icon: IconHelp,
    },
    {
      title: "Arama",
      url: "/admin/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Sözleşmeler",
      url: "/admin/contracts",
      icon: IconFileText,
    },
    {
      name: "Belgeler",
      url: "/admin/documents",
      icon: IconFileDescription,
    },
    {
      name: "Faturalar",
      url: "/admin/invoices",
      icon: IconFileInvoice,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAdmin } = useAuth()

  // Admin değilse sidebar'ı gösterme
  if (!isAdmin) {
    return null
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Image 
                src="/icon.svg" 
                alt="Inn Elegance Logo" 
                width={20} 
                height={20} 
                className="size-5"
              />
              <span className="text-base font-semibold">Inn Elegance</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
