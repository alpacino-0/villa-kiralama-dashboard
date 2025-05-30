'use client'

import { AppSidebar } from "@/app/(dashboard)/_components/app-sidebar"
import { SiteHeader } from "@/app/(dashboard)/_components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AdminGuard } from "@/components/admin-guard"
import { usePathname } from "next/navigation"

// Sayfa adı yardımcı fonksiyonu
function getPageTitle(pathname: string | null): string {
  // Null kontrolü ekleyin
  if (!pathname) return "Dashboard";
  
  // URL'den sayfa adını belirleyen fonksiyon
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  
  // Sayfa başlıklarını haritalama
  const titles: Record<string, string> = {
    'admin': 'Gösterge Paneli',
    'regions': 'Bölge Yönetimi',
    'profile': 'Profil Yönetimi',
    'tags': 'Etiket Yönetimi',
    'villas': 'Villa Yönetimi',
    'add' : 'Villa Ekle',

    // Diğer sayfalarınızı buraya ekleyin
  };
  
  // Eğer son segment bir sayfa adı ise o başlığı döndür, yoksa son segmenti kullan
  return titles[lastSegment] || (lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : "Dashboard");
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mevcut URL yolunu al
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  
  // Admin route kontrolü
  const isAdminRoute = pathname?.startsWith('/admin');
  
  const content = (
    <div className="flex flex-col min-h-screen">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title={pageTitle} />
          <main className="flex-grow">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
  
  // Admin route ise AdminGuard ile sar
  if (isAdminRoute) {
    return (
      <AdminGuard>
        {content}
      </AdminGuard>
    );
  }
  
  // Normal route
  return content;
}
