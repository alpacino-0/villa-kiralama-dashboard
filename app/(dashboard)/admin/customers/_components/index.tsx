'use client';

import React, { useState, useEffect } from 'react';
import { 
  CustomerWithVilla,
  CustomerFormData,
  CUSTOMER_STATUS
} from '@/types/customer';
import { useCustomers } from './hooks/useCustomers';
import { useVillas } from './hooks/useVillas';
import { CustomerStats } from './CustomerStats';
import { CustomerFilters as CustomerFiltersComponent } from './CustomerFilters';
import { CustomerList } from './CustomerList';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerViewModal } from './CustomerViewModal';

// Sayfalama sabitleri
const ITEMS_PER_PAGE = 10;

export default function CustomerManager() {
  // Hooks
  const {
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
  } = useCustomers();

  const {
    villaOptions,
    filteredVillas,
    villaSearchTerm,
    setVillaSearchTerm
  } = useVillas();

  // State tanımlamaları
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state'leri
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVilla | null>(null);
  
  // Form state'i
  const [formData, setFormData] = useState<CustomerFormData>({
    fullname: '',
    email: '',
    phone: '',
    identityNumber: '',
    interestedVillaId: '',
    note: '',
    status: CUSTOMER_STATUS.NEW
  });
  
  // Form validasyon state'i
  const [formErrors, setFormErrors] = useState<Partial<CustomerFormData>>({});

  // Component mount - ilk yükleme
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Müşterileri yükle - dependency'ler değiştiğinde
  useEffect(() => {
    loadCustomers({}, searchTerm, currentPage, pageSize);
  }, [loadCustomers, searchTerm, currentPage, pageSize]);

  // Arama debounce - searchTerm değiştiğinde currentPage'i sıfırla
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage]);

  // Form validasyonu
  const validateForm = (): boolean => {
    const errors: Partial<CustomerFormData> = {};

    if (!formData.fullname.trim()) {
      errors.fullname = 'Ad Soyad zorunludur';
    }

    if (!formData.email.trim()) {
      errors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (formData.identityNumber && formData.identityNumber.length !== 11) {
      errors.identityNumber = 'Kimlik numarası 11 haneli olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form sıfırlama
  const resetForm = () => {
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      identityNumber: '',
      interestedVillaId: '',
      note: '',
      status: CUSTOMER_STATUS.NEW
    });
    setFormErrors({});
  };

  // Form data değişiklik handler'ı
  const handleFormDataChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Müşteri ekleme
  const handleCreateCustomer = async () => {
    if (!validateForm()) return;

    const customerData = {
      fullname: formData.fullname.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      identityNumber: formData.identityNumber?.trim() || null,
      interestedVillaId: formData.interestedVillaId || null,
      note: formData.note?.trim() || null,
      status: formData.status
    };

    const result = await createCustomer(customerData);
    if (result) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  // Müşteri güncelleme
  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !validateForm()) return;

    const customerData = {
      fullname: formData.fullname.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      identityNumber: formData.identityNumber?.trim() || null,
      interestedVillaId: formData.interestedVillaId || null,
      note: formData.note?.trim() || null,
      status: formData.status
    };

    const result = await updateCustomer(selectedCustomer.id, customerData);
    if (result) {
      setShowEditModal(false);
      setSelectedCustomer(null);
      resetForm();
    }
  };

  // Müşteriyi düzenleme için forma yükle
  const handleEditCustomer = (customer: CustomerWithVilla) => {
    setSelectedCustomer(customer);
    setFormData({
      fullname: customer.fullname,
      email: customer.email,
      phone: customer.phone || '',
      identityNumber: customer.identityNumber || '',
      interestedVillaId: customer.interestedVillaId || '',
      note: customer.note || '',
      status: customer.status
    });
    setShowEditModal(true);
  };

  // Müşteriyi görüntüleme
  const handleViewCustomer = (customer: CustomerWithVilla) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Modal kapatma handler'ları
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <CustomerStats stats={stats} />

      {/* Arama ve Butonlar */}
      <CustomerFiltersComponent
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onExportCSV={exportCSV}
        onCreateCustomer={() => setShowCreateModal(true)}
      />

      {/* Müşteri listesi */}
      <CustomerList
        customers={customers}
        loading={loading}
        actionLoading={actionLoading}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        setPageSize={setPageSize}
        onViewCustomer={handleViewCustomer}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={deleteCustomer}
      />

      {/* Form Modalları */}
      <CustomerFormModal
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        formData={formData}
        formErrors={formErrors}
        actionLoading={actionLoading}
        villaOptions={villaOptions}
        filteredVillas={filteredVillas}
        villaSearchTerm={villaSearchTerm}
        setVillaSearchTerm={setVillaSearchTerm}
        onCloseCreate={handleCloseCreateModal}
        onCloseEdit={handleCloseEditModal}
        onFormDataChange={handleFormDataChange}
        onCreateCustomer={handleCreateCustomer}
        onUpdateCustomer={handleUpdateCustomer}
      />

      {/* Görüntüleme Modalı */}
      <CustomerViewModal
        showViewModal={showViewModal}
        selectedCustomer={selectedCustomer}
        onClose={() => setShowViewModal(false)}
        onEditCustomer={handleEditCustomer}
      />
    </div>
  );
} 