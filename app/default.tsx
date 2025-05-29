import { redirect } from 'next/navigation';

/**
 * Varsayılan Sayfa
 * 
 * Bu dosya, Next.js'nin parallel routes özelliği için varsayılan içerik 
 * sağlar. Eğer bir slot için içerik yoksa, bu sayfa gösterilir.
 */
export default function Default() {
  // Kullanıcıyı varsayılan dil (Türkçe) sayfasına yönlendir
  redirect('/');
  
  // Not: redirect çalıştığında aşağıdaki return ifadesi hiçbir zaman çalışmaz
  // Bu sadece TypeScript için tanımlanmıştır
  return null;
} 