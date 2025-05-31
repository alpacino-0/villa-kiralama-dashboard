'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VillaSEOForm } from '../../_components/VillaSEOForm'
import { useVillaSEO } from '../../_components/useVillaSEO'
import type { VillaSEOWithVilla, VillaSEOFormData } from '@/types'

interface EditVillaSEOPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditVillaSEOPage({ params }: EditVillaSEOPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { updateVillaSEO, villaSEOs, loading } = useVillaSEO()
  const [seoData, setSeoData] = useState<VillaSEOWithVilla | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // SEO verisini bul
  useEffect(() => {
    if (!loading && villaSEOs.length > 0) {
      const foundSEO = villaSEOs.find(seo => seo.id === resolvedParams.id)
      if (foundSEO) {
        setSeoData(foundSEO)
      } else {
        setError('SEO verisi bulunamadı')
      }
      setPageLoading(false)
    }
  }, [resolvedParams.id, villaSEOs, loading])

  // Form submit
  const handleSubmit = async (data: VillaSEOFormData & { villaId: string }) => {
    if (!seoData) return

    try {
      const result = await updateVillaSEO(seoData.id, data)
      if (result) {
        toast.success('SEO verisi başarıyla güncellendi')
        router.push('/admin/villaSEO')
      } else {
        toast.error('SEO verisi güncellenirken hata oluştu')
      }
    } catch {
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  // İptal işlemi
  const handleCancel = () => {
    router.push('/admin/villaSEO')
  }

  // Loading durumu
  if (pageLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>SEO verisi yükleniyor...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Hata durumu
  if (error || !seoData) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
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
              <h1 className="text-2xl font-bold">SEO Düzenle</h1>
            </div>

            <Alert variant="destructive">
              <AlertDescription>
                {error || 'SEO verisi bulunamadı. Veri silinmiş olabilir.'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold">SEO Bilgilerini Düzenle</h1>
              <p className="text-muted-foreground">
                {seoData.Villa?.title ? `Villa: ${seoData.Villa.title}` : 'SEO ayarlarını düzenleyin'}
              </p>
            </div>
          </div>

          {/* Form */}
          <VillaSEOForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={seoData}
            villaId={seoData.villaId}
            villaTitle={seoData.Villa?.title}
          />
        </div>
      </div>
    </div>
  )
} 