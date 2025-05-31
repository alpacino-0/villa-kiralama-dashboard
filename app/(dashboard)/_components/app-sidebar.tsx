"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconHome,
  IconReport,
  IconSearch,
  IconSettings,
  IconMap,
  IconTags,
  IconSeo,
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
import Link from "next/link"

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
      icon: IconChartBar,
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
  navClouds: [
    {
      title: "Yakala",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Aktif Teklifler",
          url: "#",
        },
        {
          title: "Arşivlenmiş",
          url: "#",
        },
      ],
    },
    {
      title: "Teklif",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Aktif Teklifler",
          url: "#",
        },
        {
          title: "Arşivlenmiş",
          url: "#",
        },
      ],
    },
    {
      title: "İstemler",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Aktif Teklifler",
          url: "#",
        },
        {
          title: "Arşivlenmiş",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Ayarlar",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Yardım Al",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Arama",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Veri Kütüphanesi",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Raporlar",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Kelime Asistanı",
      url: "#",
      icon: IconFileWord,
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
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image 
                  src="/icon.svg" 
                  alt="Inn Elegance Logo" 
                  width={20} 
                  height={20} 
                  className="size-5"
                />
                <span className="text-base font-semibold">Inn Elegance</span>
              </Link>
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
