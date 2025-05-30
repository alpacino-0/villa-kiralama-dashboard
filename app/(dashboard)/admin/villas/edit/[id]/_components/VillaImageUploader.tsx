"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Upload,
  X,
  Trash2,
  Loader2,
  ImageIcon,
  ImagePlus,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { VillaImage, VillaImageInsert } from "@/types/villaImage";

// Yükleme durumunu izlemek için tip
interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  title: string;
  altText: string;
  error?: string;
}

interface VillaImageUploaderProps {
  villaId: string;
  onChange?: (images: VillaImage[]) => void;
  className?: string;
}

export default function VillaImageUploader({
  villaId,
  onChange,
  className = "",
}: VillaImageUploaderProps) {
  const [existingImages, setExistingImages] = useState<VillaImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Mevcut fotoğrafları yükle - indeksleri kullanarak verimli sorgu yapıyoruz
  const fetchExistingImages = useCallback(async () => {
    if (!villaId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("VillaImage")
        .select("*")
        .eq("villaId", villaId)
        .order("order", { ascending: true });

      if (error) throw error;

      setExistingImages(data || []);
      if (onChange) onChange(data || []);
    } catch (error) {
      console.error("Villa fotoğrafları yüklenirken hata oluştu:", error);
      toast.error("Fotoğraflar yüklenemedi", {
        description: "Villa fotoğrafları yüklenirken bir sorun oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [villaId, onChange, supabase]);

  useEffect(() => {
    fetchExistingImages();
  }, [fetchExistingImages]);

  // Dosya kabul etme işlevi
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Dosya boyutu kontrolü (her dosya için 5 MB sınırı)
      const validFiles = acceptedFiles.filter((file) => file.size <= 5 * 1024 * 1024);
      
      if (validFiles.length < acceptedFiles.length) {
        toast.error("Bazı dosyalar çok büyük", {
          description: "5 MB'den büyük dosyalar yüklenmedi.",
        });
      }

      // Yükleme için hazırlık
      const newUploadingImages = validFiles.map((file) => ({
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        title: "",
        altText: "",
      }));

      setUploadingImages((prev) => [...prev, ...newUploadingImages]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    multiple: true,
  });

  // Fotoğrafı yukarı taşı (order değerini değiştir)
  const moveImageUp = async (imageId: string, currentIndex: number) => {
    if (currentIndex <= 0 || existingImages.length < 2) return;
    
    try {
      const prevImage = existingImages[currentIndex - 1];
      const currentImage = existingImages[currentIndex];
      
      // Veritabanında order değerlerini güncelle
      const batch = [
        // Önceki fotoğrafın order değerini artır
        supabase
          .from("VillaImage")
          .update({ order: currentImage.order })
          .eq("id", prevImage.id),
          
        // Mevcut fotoğrafın order değerini azalt
        supabase
          .from("VillaImage")
          .update({ order: prevImage.order })
          .eq("id", currentImage.id)
      ];
      
      await Promise.all(batch.map(query => query));
      
      // UI'ı güncelle
      const updatedImages = [...existingImages];
      [updatedImages[currentIndex - 1], updatedImages[currentIndex]] = 
        [updatedImages[currentIndex], updatedImages[currentIndex - 1]];
      
      setExistingImages(updatedImages);
      
      // Callback fonksiyonunu çağır
      if (onChange) onChange(updatedImages);
      
      toast.success("Fotoğraf sırası güncellendi");
      
    } catch (error) {
      console.error("Fotoğraf sırası güncellenirken hata oluştu:", error);
      toast.error("Sıralama başarısız", {
        description: "Fotoğraf sırası güncellenirken bir sorun oluştu."
      });
    }
  };
  
  // Fotoğrafı aşağı taşı (order değerini değiştir)
  const moveImageDown = async (imageId: string, currentIndex: number) => {
    if (currentIndex >= existingImages.length - 1 || existingImages.length < 2) return;
    
    try {
      const nextImage = existingImages[currentIndex + 1];
      const currentImage = existingImages[currentIndex];
      
      // Veritabanında order değerlerini güncelle
      const batch = [
        // Sonraki fotoğrafın order değerini azalt
        supabase
          .from("VillaImage")
          .update({ order: currentImage.order })
          .eq("id", nextImage.id),
          
        // Mevcut fotoğrafın order değerini artır
        supabase
          .from("VillaImage")
          .update({ order: nextImage.order })
          .eq("id", currentImage.id)
      ];
      
      await Promise.all(batch.map(query => query));
      
      // UI'ı güncelle
      const updatedImages = [...existingImages];
      [updatedImages[currentIndex], updatedImages[currentIndex + 1]] = 
        [updatedImages[currentIndex + 1], updatedImages[currentIndex]];
      
      setExistingImages(updatedImages);
      
      // Callback fonksiyonunu çağır
      if (onChange) onChange(updatedImages);
      
      toast.success("Fotoğraf sırası güncellendi");
      
    } catch (error) {
      console.error("Fotoğraf sırası güncellenirken hata oluştu:", error);
      toast.error("Sıralama başarısız", {
        description: "Fotoğraf sırası güncellenirken bir sorun oluştu."
      });
    }
  };

  // Fotoğrafı sil - CASCADE özelliğini dikkate alarak
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;

    try {
      // Önce fotoğraf bilgilerini al
      const { data: imageData, error: fetchError } = await supabase
        .from("VillaImage")
        .select("imageUrl, order, isCoverImage")
        .eq("id", imageId)
        .single();

      if (fetchError) throw fetchError;

      // Veritabanından sil - cascade özelliğiyle ilişkili kayıtlar da silinecek
      const { error: deleteError } = await supabase
        .from("VillaImage")
        .delete()
        .eq("id", imageId);

      if (deleteError) throw deleteError;

      // Storage'dan dosyayı sil
      if (imageData?.imageUrl) {
        const path = imageData.imageUrl.split("/").pop();
        if (path) {
          const { error: storageError } = await supabase.storage
            .from("villa-images")
            .remove([`${villaId}/${path}`]);
          
          if (storageError) {
            console.error("Storage'dan silerken hata:", storageError);
          }
        }
      }

      // Silinen fotoğrafın sırasını bulalım
      const deletedOrder = imageData.order;
      
      // Silinen fotoğraftan sonraki tüm fotoğrafların sırasını bir azaltalım
      const imagesNeedingOrderUpdate = existingImages
        .filter(img => img.order > deletedOrder)
        .map(img => ({
          id: img.id,
          newOrder: img.order - 1
        }));
        
      // Sıralama güncellemelerini yap
      if (imagesNeedingOrderUpdate.length > 0) {
        await Promise.all(
          imagesNeedingOrderUpdate.map(img => 
            supabase
              .from("VillaImage")
              .update({ order: img.newOrder })
              .eq("id", img.id)
          )
        );
      }

      // UI'ı güncelle
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      
      // Kapak fotoğrafını kontrol et ve güncelle - isCoverImage indeksini kullanarak
      if (imageData?.isCoverImage) {
        const remainingImages = existingImages.filter((img) => img.id !== imageId);
        
        if (remainingImages.length > 0) {
          // Kapak fotoğrafı silindiyse ilk fotoğrafı kapak yap
          const { error: updateError } = await supabase
            .from("VillaImage")
            .update({ isCoverImage: true })
            .eq("id", remainingImages[0].id);
          
          if (!updateError) {
            // Yerel state'i güncelle
            setExistingImages(prev => prev.map(img => 
              img.id === remainingImages[0].id 
                ? { ...img, isCoverImage: true } 
                : img
            ));
          }
        }
      }

      toast.success("Fotoğraf silindi", {
        description: "Villa fotoğrafı başarıyla silindi.",
      });
      
      // Callback çağır
      if (onChange) onChange(existingImages.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Fotoğraf silinirken hata oluştu:", error);
      toast.error("Fotoğraf silinemedi", {
        description: "Fotoğraf silinirken bir sorun oluştu.",
      });
    }
  };

  // Yüklenen fotoğraf bilgilerini güncelle
  const updateUploadingImage = (
    id: string,
    data: Partial<UploadingImage>
  ) => {
    setUploadingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...data } : img))
    );
  };

  // Yükleme işlemini iptal et
  const cancelUpload = (id: string) => {
    setUploadingImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // Önizleme URL'lerini temizle
      const removedImg = prev.find((img) => img.id === id);
      if (removedImg) {
        URL.revokeObjectURL(removedImg.preview);
      }
      return filtered;
    });
  };

  // Yükleme işlemini başlat - VillaImageInsert tip kullanarak
  const startUpload = async (uploadItem: UploadingImage) => {
    try {
      const { file, title, altText, id } = uploadItem;
      
      // villaId kontrolü ekleyelim
      if (!villaId) {
        throw new Error("Villa ID bulunamadı");
      }
      
      // Dosya adını güvenli hale getir
      const timestamp = new Date().getTime();
      const fileExt = file.name.split(".").pop();
      const fileName = `${timestamp}-${file.name
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}.${fileExt}`;
      
      // İlerleme durumunu güncelle
      updateUploadingImage(id, { progress: 20 });
      
      // Supabase Storage'a yükle
      const { error: storageError } = await supabase.storage
        .from("villa-images")
        .upload(`${villaId}/${fileName}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        console.error("Depolama hatası:", storageError);
        throw storageError;
      }
      
      // İlerleme durumunu güncelle
      updateUploadingImage(id, { progress: 50 });
      
      // Public URL oluştur
      const { data: urlData } = supabase.storage
        .from("villa-images")
        .getPublicUrl(`${villaId}/${fileName}`);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Dosya URL'si alınamadı");
      }
      
      // İlerleme durumunu güncelle
      updateUploadingImage(id, { progress: 70 });
      
      // Mevcut maksimum sıra değerini bul
      let maxOrder = 0;
      if (existingImages.length > 0) {
        maxOrder = Math.max(...existingImages.map(img => img.order)) + 1;
      }
      
      // Veritabanına kaydet - VillaImageInsert tipi kullanarak
      const isCoverImage = existingImages.length === 0 && uploadingImages[0].id === id;
      
      const villaImageData: VillaImageInsert = {
        villaId,
        imageUrl: urlData.publicUrl,
        title: title || null,
        altText: altText || null,
        order: maxOrder, // Yeni fotoğraf en sona eklensin
        isCoverImage, // İlk yüklenen resim kapak olsun
      };
      
      // İlerleme durumunu güncelle
      updateUploadingImage(id, { progress: 90 });
      
      const { data: dbData, error: dbError } = await supabase
        .from("VillaImage")
        .insert(villaImageData)
        .select()
        .single();

      if (dbError) {
        console.error("Veritabanı hatası:", dbError);
        throw dbError;
      }
      
      // Başarıyla tamamlandı
      updateUploadingImage(id, { progress: 100 });
      
      // Mevcut resimleri güncelle
      setExistingImages((prev) => [...prev, dbData]);
      
      // Callback fonksiyonunu çağır
      if (onChange) onChange([...existingImages, dbData]);
      
      // Kısa bir süre sonra yükleme listesinden kaldır
      setTimeout(() => {
        cancelUpload(id);
      }, 2000);
      
      toast.success("Fotoğraf yüklendi", {
        description: "Villa fotoğrafı başarıyla yüklendi.",
      });

    } catch (error: unknown) {
      console.error("Yükleme hatası:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      
      updateUploadingImage(uploadItem.id, { 
        error: errorMessage, 
        progress: 0 
      });
      
      toast.error("Yükleme başarısız", {
        description: `Fotoğraf yüklenirken bir sorun oluştu. Detay: ${errorMessage}`,
      });
    }
  };

  // Kapak fotoğrafını değiştir - isCoverImage indeksini kullanarak
  const setCoverImage = async (imageId: string) => {
    try {
      // Önce tüm fotoğrafların kapak durumunu false yap
      const { error: updateAllError } = await supabase
        .from("VillaImage")
        .update({ isCoverImage: false })
        .eq("villaId", villaId);
      
      if (updateAllError) throw updateAllError;
      
      // Seçilen fotoğrafı kapak yap
      const { error: updateError } = await supabase
        .from("VillaImage")
        .update({ isCoverImage: true })
        .eq("id", imageId);
      
      if (updateError) throw updateError;
      
      // UI'ı güncelle
      const updatedImages = existingImages.map(img => ({
        ...img,
        isCoverImage: img.id === imageId
      }));
      
      setExistingImages(updatedImages);
      
      // Callback fonksiyonunu çağır
      if (onChange) {
        onChange(updatedImages);
      }
      
      toast.success("Kapak fotoğrafı güncellendi", {
        description: "Villa kapak fotoğrafı başarıyla değiştirildi.",
      });
    } catch (error) {
      console.error("Kapak fotoğrafı güncellenirken hata oluştu:", error);
      toast.error("Güncelleme başarısız", {
        description: "Kapak fotoğrafı güncellenirken bir sorun oluştu.",
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload
            className={`w-10 h-10 ${
              isDragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          {isDragActive ? (
            <p className="text-primary font-medium">Dosyaları buraya bırakın</p>
          ) : (
            <>
              <p className="font-medium">
                Fotoğrafları sürükleyin veya yüklemek için tıklayın
              </p>
              <p className="text-sm text-muted-foreground">
                JPEG, PNG veya WEBP formatında. Dosya başına maksimum 5 MB.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Yükleniyor Listesi */}
      {uploadingImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Yükleniyor...</h3>
          {uploadingImages.map((img) => (
            <Card key={img.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    <Image
                      src={img.preview}
                      alt="Önizleme"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label htmlFor={`title-${img.id}`}>Başlık (opsiyonel)</Label>
                        <Input
                          id={`title-${img.id}`}
                          value={img.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateUploadingImage(img.id, { title: e.target.value })
                          }
                          placeholder="Fotoğraf başlığı"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`alt-${img.id}`}>Alt Metin (opsiyonel)</Label>
                        <Input
                          id={`alt-${img.id}`}
                          value={img.altText}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateUploadingImage(img.id, {
                              altText: e.target.value,
                            })
                          }
                          placeholder="Fotoğraf alt metni"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        {img.error ? (
                          <div className="text-sm text-destructive">
                            {img.error}
                          </div>
                        ) : img.progress > 0 ? (
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                      
                      <div className="flex gap-2">
                        {img.progress === 0 && !img.error && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => startUpload(img)}
                            variant="default"
                          >
                            Yükle
                          </Button>
                        )}
                        
                        {img.progress === 100 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-primary"
                            disabled
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Tamamlandı
                          </Button>
                        )}
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelUpload(img.id)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                          <span className="sr-only">İptal</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mevcut Fotoğraflar */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Villa Fotoğrafları {existingImages.length > 0 && `(${existingImages.length})`}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : existingImages.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Henüz yüklenmiş fotoğraf bulunmuyor
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingImages.map((image, index) => (
              <div key={image.id} className="bg-white border rounded-md shadow-sm overflow-hidden flex flex-col h-full">
                {/* Resim Alanı - Kenar boşluğu olmayan yapı */}
                <div className="relative w-full aspect-[4/3] bg-muted">
                  <Image
                    src={image.imageUrl}
                    alt={image.altText || "Villa fotoğrafı"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    priority={index < 6}
                  />
                  {image.isCoverImage && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                      Kapak Fotoğrafı
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-md shadow-sm">
                    Sıra: {index + 1}
                  </div>
                </div>
                
                {/* İçerik Alanı - Sabit padding ile */}
                <div className="p-3 flex flex-col flex-1">
                  <div className="space-y-1 mb-2 flex-1">
                    {image.title && (
                      <p className="text-sm font-medium line-clamp-1">{image.title}</p>
                    )}
                    {image.altText && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {image.altText}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto border-t pt-2">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveImageUp(image.id, index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Yukarı Taşı</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveImageDown(image.id, index)}
                        disabled={index === existingImages.length - 1}
                        className="h-8 w-8 p-0"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Aşağı Taşı</span>
                      </Button>
                    </div>
                    
                    <div className="flex gap-1">
                      {!image.isCoverImage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCoverImage(image.id)}
                          className="h-8 text-xs px-2 py-0"
                        >
                          <ImagePlus className="w-3 h-3 mr-1" />
                          Kapak Yap
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteImage(image.id)}
                        className="text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Sil</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 