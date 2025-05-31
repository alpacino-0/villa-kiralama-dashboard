import React from 'react';
import { Search, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onExportCSV: () => void;
  onCreateCustomer: () => void;
}

export function CustomerFilters({
  searchTerm,
  setSearchTerm,
  onExportCSV,
  onCreateCustomer
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onExportCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          CSV İndir
        </Button>
        
        <Button
          onClick={onCreateCustomer}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri
        </Button>
      </div>
    </div>
  );
} 