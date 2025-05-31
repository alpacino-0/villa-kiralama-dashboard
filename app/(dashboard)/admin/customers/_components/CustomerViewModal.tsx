import React from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CustomerWithVilla, 
  CUSTOMER_STATUS_LABELS, 
  CUSTOMER_STATUS_COLORS 
} from '@/types/customer';

interface CustomerViewModalProps {
  showViewModal: boolean;
  selectedCustomer: CustomerWithVilla | null;
  onClose: () => void;
  onEditCustomer: (customer: CustomerWithVilla) => void;
}

export function CustomerViewModal({
  showViewModal,
  selectedCustomer,
  onClose,
  onEditCustomer
}: CustomerViewModalProps) {
  return (
    <Dialog open={showViewModal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Müşteri Detayları</DialogTitle>
        </DialogHeader>
        
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Ad Soyad</Label>
                <p className="text-sm">{selectedCustomer.fullname}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">E-posta</Label>
                <p className="text-sm">{selectedCustomer.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Telefon</Label>
                <p className="text-sm">{selectedCustomer.phone || '-'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Kimlik Numarası</Label>
                <p className="text-sm">{selectedCustomer.identityNumber || '-'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Durum</Label>
                <Badge className={CUSTOMER_STATUS_COLORS[selectedCustomer.status]}>
                  {CUSTOMER_STATUS_LABELS[selectedCustomer.status]}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">İlgilenilen Villa</Label>
                <p className="text-sm">
                  {selectedCustomer.interestedVilla ? 
                    `${selectedCustomer.interestedVilla.title} (${selectedCustomer.interestedVilla.mainRegion})` : 
                    '-'
                  }
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Oluşturma Tarihi</Label>
                <p className="text-sm">
                  {new Date(selectedCustomer.createdAt || '').toLocaleDateString('tr-TR')}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Güncelleme Tarihi</Label>
                <p className="text-sm">
                  {selectedCustomer.updatedAt ? 
                    new Date(selectedCustomer.updatedAt).toLocaleDateString('tr-TR') : 
                    '-'
                  }
                </p>
              </div>
            </div>
            
            {selectedCustomer.note && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Not</Label>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedCustomer.note}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          {selectedCustomer && (
            <Button
              onClick={() => {
                onClose();
                onEditCustomer(selectedCustomer);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 