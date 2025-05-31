import React, { useState } from 'react';
import { Save, Loader2, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  CustomerFormData, 
  CUSTOMER_STATUS_LABELS
} from '@/types/customer';
import { VillaOption } from './hooks/useVillas';

interface CustomerFormModalProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  formData: CustomerFormData;
  formErrors: Partial<CustomerFormData>;
  actionLoading: string | null;
  villaOptions: VillaOption[];
  filteredVillas: VillaOption[];
  villaSearchTerm: string;
  setVillaSearchTerm: (term: string) => void;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onFormDataChange: (field: keyof CustomerFormData, value: string) => void;
  onCreateCustomer: () => void;
  onUpdateCustomer: () => void;
}

export function CustomerFormModal({
  showCreateModal,
  showEditModal,
  formData,
  formErrors,
  actionLoading,
  villaOptions,
  filteredVillas,
  villaSearchTerm,
  setVillaSearchTerm,
  onCloseCreate,
  onCloseEdit,
  onFormDataChange,
  onCreateCustomer,
  onUpdateCustomer
}: CustomerFormModalProps) {
  const [villaSearchOpen, setVillaSearchOpen] = useState(false);

  const renderVillaSelector = () => (
    <div>
      <Label htmlFor="interestedVilla">İlgilenilen Villa</Label>
      <Popover open={villaSearchOpen} onOpenChange={setVillaSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={villaSearchOpen}
            className="w-full justify-between"
          >
            {formData.interestedVillaId && formData.interestedVillaId !== 'none' ? (
              <span className="truncate">
                {villaOptions.find(villa => villa.id === formData.interestedVillaId)?.title || 'Villa seçildi'}
                <span className="text-muted-foreground ml-1">
                  ({villaOptions.find(villa => villa.id === formData.interestedVillaId)?.mainRegion})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Villa seçin...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-none p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Villa ara..." 
              value={villaSearchTerm}
              onValueChange={setVillaSearchTerm}
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>Villa bulunamadı.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onFormDataChange('interestedVillaId', '');
                    setVillaSearchOpen(false);
                    setVillaSearchTerm('');
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Seçim yok</span>
                    <span className="text-sm text-muted-foreground">Villa seçimi yapma</span>
                  </div>
                </CommandItem>
                {filteredVillas.map((villa) => (
                  <CommandItem
                    key={villa.id}
                    value={`${villa.title} ${villa.mainRegion} ${villa.subRegion}`}
                    onSelect={() => {
                      onFormDataChange('interestedVillaId', villa.id);
                      setVillaSearchOpen(false);
                      setVillaSearchTerm('');
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{villa.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {villa.mainRegion}, {villa.subRegion}
                      </span>
                    </div>
                    {formData.interestedVillaId === villa.id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  const renderFormFields = (isEdit = false) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? "edit-fullname" : "fullname"}>Ad Soyad *</Label>
          <Input
            id={isEdit ? "edit-fullname" : "fullname"}
            value={formData.fullname}
            onChange={(e) => onFormDataChange('fullname', e.target.value)}
            className={formErrors.fullname ? 'border-red-500' : ''}
          />
          {formErrors.fullname && (
            <p className="text-sm text-red-500 mt-1">{formErrors.fullname}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor={isEdit ? "edit-email" : "email"}>E-posta *</Label>
          <Input
            id={isEdit ? "edit-email" : "email"}
            type="email"
            value={formData.email}
            onChange={(e) => onFormDataChange('email', e.target.value)}
            className={formErrors.email ? 'border-red-500' : ''}
          />
          {formErrors.email && (
            <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor={isEdit ? "edit-phone" : "phone"}>Telefon</Label>
          <Input
            id={isEdit ? "edit-phone" : "phone"}
            value={formData.phone}
            onChange={(e) => onFormDataChange('phone', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor={isEdit ? "edit-identityNumber" : "identityNumber"}>Kimlik Numarası</Label>
          <Input
            id={isEdit ? "edit-identityNumber" : "identityNumber"}
            value={formData.identityNumber}
            onChange={(e) => onFormDataChange('identityNumber', e.target.value)}
            maxLength={11}
            className={formErrors.identityNumber ? 'border-red-500' : ''}
          />
          {formErrors.identityNumber && (
            <p className="text-sm text-red-500 mt-1">{formErrors.identityNumber}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor={isEdit ? "edit-status" : "status"}>Durum</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => onFormDataChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CUSTOMER_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {renderVillaSelector()}
      </div>
      
      <div>
        <Label htmlFor={isEdit ? "edit-note" : "note"}>Not</Label>
        <Textarea
          id={isEdit ? "edit-note" : "note"}
          value={formData.note}
          onChange={(e) => onFormDataChange('note', e.target.value)}
          rows={3}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Yeni Müşteri Modal */}
      <Dialog open={showCreateModal} onOpenChange={onCloseCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          
          {renderFormFields(false)}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCloseCreate}>
              İptal
            </Button>
            <Button
              onClick={onCreateCustomer}
              disabled={actionLoading === 'create'}
            >
              {actionLoading === 'create' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Düzenleme Modal */}
      <Dialog open={showEditModal} onOpenChange={onCloseEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
          </DialogHeader>
          
          {renderFormFields(true)}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCloseEdit}>
              İptal
            </Button>
            <Button
              onClick={onUpdateCustomer}
              disabled={actionLoading === 'update'}
            >
              {actionLoading === 'update' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 