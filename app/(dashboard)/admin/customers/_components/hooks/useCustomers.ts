import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import {
  CustomerInsert,
  CustomerUpdate,
  CustomerStatus,
  CustomerWithVilla,
  CustomerFilters,
  CustomerStats
} from '@/types/customer';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerWithVilla[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Müşteri istatistiklerini yükle
  const loadStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('status, createdAt');

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats: CustomerStats = {
        total: data?.length || 0,
        byStatus: {
          NEW: 0,
          CONTACTED: 0,
          INTERESTED: 0,
          BOOKED: 0,
          CLOSED: 0,
          LOST: 0
        },
        newThisMonth: 0,
        conversionRate: 0
      };

      data?.forEach(customer => {
        stats.byStatus[customer.status as CustomerStatus]++;
        
        const createdAt = new Date(customer.createdAt || '');
        if (createdAt >= thisMonth) {
          stats.newThisMonth++;
        }
      });

      // Dönüşüm oranını hesapla
      const potentialCustomers = stats.byStatus.NEW + stats.byStatus.CONTACTED + stats.byStatus.INTERESTED;
      if (potentialCustomers > 0) {
        stats.conversionRate = Math.round((stats.byStatus.BOOKED / potentialCustomers) * 100);
      }

      setStats(stats);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  }, []);

  // Müşterileri yükle
  const loadCustomers = useCallback(async (
    filters: CustomerFilters = {},
    searchTerm: string = '',
    currentPage: number = 1,
    pageSize: number = 10
  ) => {
    setLoading(true);
    try {
      let query = supabase
        .from('Customer')
        .select(`
          *,
          interestedVilla:interestedVillaId (
            id,
            title,
            mainRegion,
            subRegion
          )
        `, { count: 'exact' });

      // Filtreleri uygula
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.villaId) {
        query = query.eq('interestedVillaId', filters.villaId);
      }
      
      if (searchTerm) {
        query = query.or(`fullname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      if (filters.dateFrom) {
        query = query.gte('createdAt', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('createdAt', filters.dateTo);
      }

      // Sayfalama ve sıralama
      const startIndex = (currentPage - 1) * pageSize;
      query = query
        .order('createdAt', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Müşteri ekleme
  const createCustomer = async (customerData: CustomerInsert): Promise<CustomerWithVilla | null> => {
    setActionLoading('create');
    try {
      const { data, error } = await supabase
        .from('Customer')
        .insert([customerData])
        .select(`
          *,
          interestedVilla:interestedVillaId (
            id,
            title,
            mainRegion,
            subRegion
          )
        `)
        .single();

      if (error) throw error;

      setCustomers(prev => [data, ...prev]);
      await loadStats();
      return data;
    } catch (error) {
      console.error('Müşteri oluşturulurken hata:', error);
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  // Müşteri güncelleme
  const updateCustomer = async (customerId: string, customerData: CustomerUpdate): Promise<CustomerWithVilla | null> => {
    setActionLoading('update');
    try {
      const updateData = {
        ...customerData,
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('Customer')
        .update(updateData)
        .eq('id', customerId)
        .select(`
          *,
          interestedVilla:interestedVillaId (
            id,
            title,
            mainRegion,
            subRegion
          )
        `)
        .single();

      if (error) throw error;

      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId ? data : customer
        )
      );
      
      await loadStats();
      return data;
    } catch (error) {
      console.error('Müşteri güncellenirken hata:', error);
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  // Müşteri silme
  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return false;

    setActionLoading(customerId);
    try {
      const { error } = await supabase
        .from('Customer')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      await loadStats();
      return true;
    } catch (error) {
      console.error('Müşteri silinirken hata:', error);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // CSV export
  const exportCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select(`
          *,
          interestedVilla:interestedVillaId (
            title,
            mainRegion,
            subRegion
          )
        `);

      if (error) throw error;

      const csvContent = [
        ['Ad Soyad', 'E-posta', 'Telefon', 'Kimlik No', 'İlgilenilen Villa', 'Durum', 'Not', 'Oluşturma Tarihi'].join(','),
        ...(data || []).map(customer => [
          customer.fullname,
          customer.email,
          customer.phone || '',
          customer.identityNumber || '',
          customer.interestedVilla?.title || '',
          customer.status,
          customer.note || '',
          new Date(customer.createdAt || '').toLocaleDateString('tr-TR')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `musteriler_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('CSV export hatası:', error);
    }
  };

  return {
    customers,
    stats,
    loading,
    actionLoading,
    totalCount,
    loadStats,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    exportCSV
  };
} 