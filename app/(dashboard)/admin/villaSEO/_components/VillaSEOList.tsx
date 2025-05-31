'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { VillaSEOWithVilla } from '@/types'

interface VillaSEOListProps {
  villaSEOs: VillaSEOWithVilla[]
  loading: boolean
  error: string | null
  onEdit: (villaSEO: VillaSEOWithVilla) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function VillaSEOList({ 
  villaSEOs, 
  loading, 
  error, 
  onEdit, 
  onDelete, 
  onAdd 
}: VillaSEOListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Arama filtresi
  const filteredSEOs = villaSEOs.filter(seo => 
    seo.Villa?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seo.metaTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seo.Villa?.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header ve Arama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Villa SEO Yönetimi</h2>
          <p className="text-muted-foreground">
            Villaların SEO ayarlarını yönetin
          </p>
        </div>
        <Button onClick={onAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni SEO Ekle
        </Button>
      </div>

      {/* Arama Kutusu */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Villa adı, meta başlık veya slug ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* SEO Listesi */}
      {filteredSEOs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 'Arama kriterlerine uygun SEO verisi bulunamadı.' : 'Henüz SEO verisi bulunmuyor.'}
            </p>
            {!searchTerm && (
              <Button onClick={onAdd} className="mt-4">
                İlk SEO Verisini Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSEOs.map((seo) => (
            <Card key={seo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {seo.Villa?.title || 'Villa Başlığı Yok'}
                      </h3>
                      {seo.noIndex && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          No Index
                        </Badge>
                      )}
                    </div>
                    
                    {seo.Villa?.slug && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Slug: /{seo.Villa.slug}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(seo)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Düzenle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(seo.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>

                {/* SEO Bilgileri */}
                <div className="space-y-3">
                  {seo.metaTitle && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Meta Başlık
                      </Label>
                      <p className="text-sm">{seo.metaTitle}</p>
                    </div>
                  )}
                  
                  {seo.metaDescription && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Meta Açıklama
                      </Label>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {seo.metaDescription}
                      </p>
                    </div>
                  )}
                  
                  {seo.metaKeywords && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Anahtar Kelimeler
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {seo.metaKeywords.split(',').map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(seo.ogTitle || seo.ogDescription) && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Open Graph Bilgileri
                      </Label>
                      {seo.ogTitle && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">OG Başlık:</span> {seo.ogTitle}
                        </p>
                      )}
                      {seo.ogDescription && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">OG Açıklama:</span> {seo.ogDescription}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Zaman Bilgileri */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <span>
                    Oluşturuldu: {new Date(seo.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                  <span>
                    Güncellendi: {new Date(seo.updatedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sonuç Sayısı */}
      {filteredSEOs.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {searchTerm ? (
            <>
              <strong>{filteredSEOs.length}</strong> sonuç bulundu 
              (toplam {villaSEOs.length} kayıttan)
            </>
          ) : (
            <>Toplam <strong>{villaSEOs.length}</strong> SEO kaydı</>
          )}
        </div>
      )}
    </div>
  )
}

// Label bileşeni eksikse import edelim
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

function Label({ children, className, ...props }: LabelProps) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  )
} 