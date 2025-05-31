'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VillaSEOList } from './_components/VillaSEOList'
import { useVillaSEO } from './_components/useVillaSEO'
import type { VillaSEOWithVilla } from '@/types'

export default function VillaSEOPage() {
  const router = useRouter()
  const {
    villaSEOs,
    loading,
    error,
    deleteVillaSEO,
  } = useVillaSEO()

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Yeni SEO ekleme - yeni sayfaya yönlendir
  const handleAdd = () => {
    router.push('/admin/villaSEO/new')
  }

  // SEO düzenleme - düzenleme sayfasına yönlendir
  const handleEdit = (seo: VillaSEOWithVilla) => {
    router.push(`/admin/villaSEO/${seo.id}/edit`)
  }

  // SEO silme
  const handleDelete = async (id: string) => {
    try {
      const success = await deleteVillaSEO(id)
      if (success) {
        toast.success('SEO verisi başarıyla silindi')
      } else {
        toast.error('SEO verisi silinirken hata oluştu')
      }
    } catch {
      toast.error('Silme işlemi sırasında hata oluştu')
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Ana SEO Listesi */}
          <VillaSEOList
            villaSEOs={villaSEOs}
            loading={loading}
            error={error}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirm(id)}
          />

          {/* Silme Onay Dialog */}
          {deleteConfirm && (
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>SEO Verisini Sil</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Bu SEO verisini silmek istediğinizden emin misiniz? 
                    Bu işlem geri alınamaz ve villa&apos;nın SEO ayarları tamamen kaldırılacaktır.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                    İptal
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  >
                    Evet, Sil
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}
