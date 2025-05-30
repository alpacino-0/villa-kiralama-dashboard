import { Profile } from "@/types/profiles"

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 */
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'ADMIN'
}

/**
 * Kullanıcının customer olup olmadığını kontrol eder
 */
export function isCustomer(profile: Profile | null): boolean {
  return profile?.role === 'CUSTOMER'
}

/**
 * Rol bazlı erişim kontrolü
 */
export function hasRole(profile: Profile | null, role: 'ADMIN' | 'CUSTOMER'): boolean {
  return profile?.role === role
}

/**
 * Kullanıcının admin paneline erişim yetkisi var mı
 */
export function canAccessAdminPanel(profile: Profile | null): boolean {
  return isAdmin(profile)
}

/**
 * Rol görüntü adı
 */
export function getRoleDisplayName(role: 'ADMIN' | 'CUSTOMER'): string {
  const roleNames = {
    ADMIN: 'Yönetici',
    CUSTOMER: 'Müşteri'
  }
  
  return roleNames[role] || role
} 