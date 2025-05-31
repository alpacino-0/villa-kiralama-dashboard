'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { VillaSEOForm } from '../_components/VillaSEOForm'
import { useVillaSEO } from '../_components/useVillaSEO'
import type { VillaSEOFormData } from '@/types'

export default function NewVillaSEOPage() {
  const router = useRouter()
  const { createVillaSEO } = useVillaSEO()

  // Form submit
  const handleSubmit = async (data: VillaSEOFormData & { villaId: string }) => {
    try {
      const result = await createVillaSEO(data)
      if (result) {
        toast.success('SEO verisi başarıyla eklendi')
        router.push('/admin/villaSEO')
      } else {
        toast.error('SEO verisi eklenirken hata oluştu')
      }
    } catch {
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  // İptal işlemi
  const handleCancel = () => {
    router.push('/admin/villaSEO')
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/villaSEO')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Yeni SEO Verisi Ekle</h1>
              <p className="text-muted-foreground">
                Villa için SEO ayarları oluşturun
              </p>
            </div>
          </div>

          {/* Form - Card wrapper kaldırıldı */}
          <VillaSEOForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
} 