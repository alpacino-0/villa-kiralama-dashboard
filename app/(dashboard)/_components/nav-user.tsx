"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getRoleDisplayName } from "@/lib/utils/auth-utils"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Çıkış yap fonksiyonu
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error)
    }
  }

  // Sayfalar arası yönlendirme fonksiyonları
  const handleNavigateToProfile = () => {
    router.push("/admin/profile")
  }

  const handleNavigateToUpdatePassword = () => {
    router.push("/admin/update-password")
  }

  const handleNavigateToNotifications = () => {
    // TODO: Bildirimler sayfası henüz hazır değil
    console.log("Bildirimler sayfasına yönlendirilecek")
  }

  // Loading durumunda
  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Kullanıcı giriş yapmamışsa
  if (!user || !profile) {
    return null
  }

  // Kullanıcı bilgileri
  const userName = profile.full_name || user.email?.split('@')[0] || "Kullanıcı"
  const userEmail = user.email || ""
  const userRole = profile.role ? getRoleDisplayName(profile.role) : ""
  
  // Avatar için baş harfleri al
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/avatars/default.jpg" alt={userName} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {userEmail}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/avatars/default.jpg" alt={userName} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userEmail}
                  </span>
                  {userRole && (
                    <span className="text-muted-foreground truncate text-xs">
                      {userRole}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleNavigateToProfile} className="cursor-pointer">
                <IconUserCircle className="mr-2 h-4 w-4" />
                Hesap Ayarları
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNavigateToUpdatePassword} className="cursor-pointer">
                <IconCreditCard className="mr-2 h-4 w-4" />
                Şifre Güncelle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNavigateToNotifications} className="cursor-pointer">
                <IconNotification className="mr-2 h-4 w-4" />
                Bildirimler
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <IconLogout className="mr-2 h-4 w-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
