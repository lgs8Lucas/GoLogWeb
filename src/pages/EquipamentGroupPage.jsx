import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Layers, Plus, Save, X, Truck, Box, Building2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import Hint from '../components/ui/Hint';
import { equipamentGroupService } from '../services/equipamentGroupService';
import { equipamentService } from '../services/equipamentService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { extractErrorMessage } from '../utils/errorUtils';

const EquipamentGroupPage = () => {
  const [searchParams] = useSearchParams();
  const editParamId = searchParams.get('edit');

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  
  const initialFormState = {
    observation: '',
    equipament1Id: '',
    equipament2Id: '',
    equipament3Id: '',
    companyId: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [equipments, setEquipments] = useState([]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await equipamentGroupService.getAll();
      setGroups(data || []);

      if (editParamId && data && data.length > 0) {
        const target = data.find(g => g.id === editParamId);
        if (target) {
          handleEditClick(target);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conjuntos:', error);
      showToast('Erro ao carregar lista de conjuntos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    const loadData = async () => {
      try {
        const [equipsData] = await Promise.all([
          equipamentService.getAll()
        ]);
        setEquipments(equipsData || []);
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares:", err);
      }
    };
    loadData();
  }, [editParamId]);

  // Tração = cavalo/caminhão (sem volume máximo); reboque = carreta. Equipamentos já usados em outro
  // conjunto não aparecem (a API rejeitaria), exceto os do próprio conjunto em edição.
  const usedByOtherGroups = new Set(
    groups
      .filter(g => g.id !== editingId)
      .flatMap(g => [g.equipament1?.id, g.equipament2?.id, g.equipament3?.id])
      .filter(Boolean)
  );
  const isTrailer = (eq) => eq.maximumVolume !== undefined && eq.maximumVolume !== null;
  const tractorOptions = equipments.filter(eq => !isTrailer(eq) && !usedByOtherGroups.has(eq.id));
  const trailerOptions = equipments.filter(eq => isTrailer(eq) && !usedByOtherGroups.has(eq.id));
  const ownerOfTractor = (() => {
    const eq = equipments.find(e => e.id === formData.equipament1Id);
    return eq?.company?.legalName || '';
  })();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextForm = { ...formData, [name]: value };

    // Se selecionou o equipamento 1 e ainda não tem empresa definida, auto-seleciona a empresa dele
    if (name === 'equipament1Id' && value) {
      const selectedEq = equipments.find(eq => eq.id === value);
      if (selectedEq && (selectedEq.companyId || selectedEq.company?.id)) {
        nextForm.companyId = selectedEq.companyId || selectedEq.company?.id;
      }
    }

    setFormData(nextForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        observation: formData.observation,
        equipament1Id: formData.equipament1Id,
        equipament2Id: formData.equipament2Id || null,
        equipament3Id: formData.equipament3Id || null
      };
      if (editingId) {
        await equipamentGroupService.update(editingId, payload);
        showToast('Conjunto atualizado com sucesso!', 'success');
      } else {
        await equipamentGroupService.create(payload);
        showToast('Conjunto salvo com sucesso!', 'success');
      }
      handleCloseModal();
      fetchGroups();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast(extractErrorMessage(error, 'Erro ao salvar conjunto.'), 'error');
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setFormData({
      observation: row.observation || '',
      equipament1Id: row.equipament1?.id || '',
      equipament2Id: row.equipament2?.id || '',
      equipament3Id: row.equipament3?.id || '',
      companyId: row.company?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (row) => {
    setGroupToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await equipamentGroupService.delete(groupToDelete.id);
      showToast('Conjunto excluído com sucesso!', 'success');
      fetchGroups();
    } catch (error) {
      console.error('Erro ao deletar conjunto:', error);
      showToast(extractErrorMessage(error, 'Erro ao excluir conjunto.'), 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const columns = [
    {
      label: 'Código',
      key: 'id',
      render: (row) => (
        <span 
          style={{ cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}
          onClick={() => handleEditClick(row)}
          title="Clique para editar este conjunto"
        >
          #{row.id.substring(0, 8)}
        </span>
      )
    },
    { 
      label: 'Identificação / Observação', 
      key: 'observation',
      render: (row) => <strong>{row.observation || 'Sem identificação'}</strong>
    },
    { 
      label: 'Composição de Veículos (Frota)', 
      key: 'plates',
      render: (row) => {
        const hasEquips = row.equipament1 || row.equipament2 || row.equipament3;
        if (!hasEquips) return <span style={{ color: 'var(--text-muted)' }}>Nenhum veículo vinculado</span>;

        return (
          <div className="equip-badges-container">
            {row.equipament1 && (
              <Link 
                to={`/frota?edit=${row.equipament1.id}`}
                className="equip-pill tractor"
                title={`Cavalo Mecânico: ${row.equipament1.model || ''} - Clique para editar`}
              >
                <Truck size={14} />
                <span><strong>Cavalo:</strong> {row.equipament1.plate}</span>
              </Link>
            )}
            {row.equipament2 && (
              <Link 
                to={`/frota?edit=${row.equipament2.id}`}
                className="equip-pill trailer"
                title={`Carreta 1: ${row.equipament2.model || ''} - Clique para editar`}
              >
                <Box size={14} />
                <span><strong>Carreta:</strong> {row.equipament2.plate}</span>
              </Link>
            )}
            {row.equipament3 && (
              <Link 
                to={`/frota?edit=${row.equipament3.id}`}
                className="equip-pill trailer"
                title={`Carreta 2: ${row.equipament3.model || ''} - Clique para editar`}
              >
                <Box size={14} />
                <span><strong>Carreta 2:</strong> {row.equipament3.plate}</span>
              </Link>
            )}
          </div>
        );
      }
    },
    { 
      label: 'Empresa Vinculada', 
      key: 'company',
      render: (row) => row.company?.id ? (
        <Link 
          to={`/empresas?edit=${row.company.id}`} 
          className="entity-link"
          title={`Ver empresa ${row.company.legalName}`}
        >
          <Building2 size={13} />
          <span>{row.company.legalName || 'Empresa'}</span>
        </Link>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>{row.company?.legalName || '-'}</span>
      )
    }
  ];

  const groupFilterConfigs = [
    { key: 'empresa', label: 'Empresa', accessor: (row) => row.company?.legalName || '' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Conjuntos de Equipamentos"
        description="Associação entre caminhões tratores e carretas para formação de composições rodoviárias."
        icon={Layers}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Conjunto
        </button>
      </PageHeader>

      <Hint id="group-flow" title="Quando cadastrar um conjunto" compact>
          Veículos rígidos (moto, carro, utilitário, van, VUC, toco, truck, bitruck) já ganham um conjunto automático ao serem
          cadastrados na Frota. Use esta tela para <b>cavalos mecânicos</b>: combine o cavalo com 1 ou 2 carretas — a capacidade
          de peso e volume do conjunto passa a ser a das carretas.
      </Hint>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={groups} 
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          itemsPerPage={12}
          filterConfigs={groupFilterConfigs}
          searchPlaceholder="Pesquisar por identificação, código ou placa..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Conjunto' : 'Novo Conjunto'}</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="form-group col-span-2">
                    <label className="form-label">Identificação / Observação *</label>
                    <input 
                      type="text" 
                      name="observation" 
                      value={formData.observation} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Ex: Bitrem Graneleiro 01 ou Conjunto Rota Sul"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Caminhão Trator / Cavalo Mecânico (Equipamento 1) *</label>
                    <select 
                      name="equipament1Id" 
                      value={formData.equipament1Id} 
                      onChange={handleInputChange} 
                      className="form-select" 
                      required
                    >
                      <option value="">Selecione o veículo de tração...</option>
                      {tractorOptions.length === 0 && <option value="" disabled>Nenhum cavalo/caminhão livre — cadastre na Frota</option>}
                      {tractorOptions.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.plate} - {eq.model || 'Veículo'} ({eq.maximumVolume != null ? 'Carreta' : 'Cavalo/Truck'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Empresa Proprietária / Operadora</label>
                    <input
                      className="form-input"
                      value={ownerOfTractor || 'Definida pelo cavalo/caminhão selecionado'}
                      readOnly
                      disabled
                      title="O conjunto pertence à mesma empresa do veículo de tração"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Carreta / Semirreboque 1 (Equipamento 2 - Opcional)</label>
                    <select 
                      name="equipament2Id" 
                      value={formData.equipament2Id} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="">Nenhum (ou semicarreta)...</option>
                      {trailerOptions.filter(e => e.id !== formData.equipament3Id).map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.plate} - {eq.model || 'Implemento'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Carreta 2 / Segundo Reboque (Equipamento 3 - Opcional)</label>
                    <select 
                      name="equipament3Id" 
                      value={formData.equipament3Id} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="">Nenhum (Composição simples)...</option>
                      {trailerOptions.filter(e => e.id !== formData.equipament2Id).map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.plate} - {eq.model || 'Implemento'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Salvar Conjunto
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Conjunto"
        message={`Tem certeza que deseja excluir o conjunto "${groupToDelete?.observation || ''}"?`}
      />
    </div>
  );
};

export default EquipamentGroupPage;
