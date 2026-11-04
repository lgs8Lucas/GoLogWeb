import React, { useState, useEffect, useCallback } from 'react';
import { Package, FileUp, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import ImportInvoicesModal from '../components/ImportInvoicesModal';
import DeliveryModal from '../components/DeliveryModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastContext';
import { deliveryService } from '../services/deliveryService';
import { extractErrorMessage } from '../utils/errorUtils';
import '../styles/Profiles.css'; // Reusing standard styles

const ShipmentPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState(null);
  const { showToast } = useToast();

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getAll();
      setShipments(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      showToast('Erro ao carregar entregas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleSaveDelivery = async (deliveryData, id) => {
    try {
      if (id) {
        await deliveryService.update(id, deliveryData);
        showToast('Remessa atualizada com sucesso!', 'success');
      } else {
        await deliveryService.create(deliveryData);
        showToast('Remessa cadastrada com sucesso!', 'success');
      }
      setIsDeliveryModalOpen(false);
      setEditingDelivery(null);
      fetchShipments();
    } catch (error) {
      console.error('Erro ao salvar remessa:', error);
      showToast(extractErrorMessage(error, 'Erro ao salvar remessa.'), 'error');
    }
  };

  const handleEdit = (row) => {
    setEditingDelivery(row);
    setIsDeliveryModalOpen(true);
  };

  const handleDelete = (row) => {
    setDeliveryToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deliveryToDelete) return;
    try {
      await deliveryService.delete(deliveryToDelete.id);
      showToast('Entrega excluída com sucesso!', 'success');
      fetchShipments();
    } catch (error) {
      console.error('Erro ao excluir entrega:', error);
      showToast(extractErrorMessage(error, 'Erro ao excluir entrega.'), 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setDeliveryToDelete(null);
    }
  };

  const shipmentFilterConfigs = [
    {
      key: 'typeOperation',
      label: 'Operação',
      options: [
        { label: 'Entrega', value: 'ENTREGA' },
        { label: 'Coleta', value: 'COLETA' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Pendente', value: 'PENDENTE' },
        { label: 'Em Transporte', value: 'EM_TRANSPORTE' },
        { label: 'Entregue / Concluído', value: 'FINALIZADO' }
      ]
    }
  ];

  const columns = [
    { 
      label: 'Código', 
      key: 'id', 
      render: (row) => (
        <span 
          style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary-color)' }}
          onClick={() => handleEdit(row)}
          title="Clique para editar"
        >
          {row.id ? `#${row.id.substring(0, 8)}` : 'N/A'}
        </span>
      )
    },
    { 
      label: 'Operação', 
      key: 'typeOperation', 
      render: (row) => (
        <span className={`status-chip ${row.typeOperation === 'COLETA' ? 'warning' : 'info'}`}>
          {row.typeOperation || 'ENTREGA'}
        </span>
      ) 
    },
    { label: 'Cliente / Parceiro', key: 'customer', render: (row) => row.customer?.legalName || '-' },
    { label: 'Peso', key: 'weight', render: (row) => `${row.weight || 0} kg` },
    { label: 'Volume', key: 'volume', render: (row) => `${row.volume || 0} m³` },
    { label: 'Agendamento', key: 'schedulind', render: (row) => row.schedulind ? new Date(row.schedulind).toLocaleString('pt-BR') : '-' },
    { 
      label: 'Status', 
      key: 'status', 
      render: (row) => {
        const s = (row.status || 'PENDENTE').toLowerCase();
        let chipClass = 'info';
        if (s.includes('finaliz') || s.includes('concl') || s.includes('entreg')) chipClass = 'active';
        else if (s.includes('pend') || s.includes('espera')) chipClass = 'warning';
        else if (s.includes('cancel') || s.includes('erro')) chipClass = 'danger';
        return <span className={`status-chip ${chipClass}`}>{row.status || 'PENDENTE'}</span>;
      }
    }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader 
        title="Entregas & Cargas"
        description="Acompanhe todas as ordens de coleta e entrega registradas no sistema."
        icon={Package}
        onBack={true}
      >
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingDelivery(null);
              setIsDeliveryModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} />
            Nova Carga / Remessa
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsImportModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileUp size={16} />
            Importar NF-e (ERP)
          </button>
        </div>
      </PageHeader>

      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setEditingDelivery(null);
        }}
        onSave={handleSaveDelivery}
        initialData={editingDelivery}
      />

      <ImportInvoicesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchShipments();
        }}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeliveryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Entrega"
        message={`Tem certeza que deseja excluir esta entrega${deliveryToDelete?.id ? ` (#${deliveryToDelete.id.substring(0, 8)})` : ''}?`}
      />

      <div className="card">
        <DataTable 
          columns={columns} 
          data={shipments} 
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nenhuma entrega registrada."
          itemsPerPage={15}
          filterConfigs={shipmentFilterConfigs}
          searchPlaceholder="Pesquisar por código, cliente, operação ou status..."
        />
      </div>
    </div>
  );
};

export default ShipmentPage;
