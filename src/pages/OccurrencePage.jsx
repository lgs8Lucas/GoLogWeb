import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Plus, Save, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { occurrenceService } from '../services/occurrenceService';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { useToast } from '../components/ToastContext';

const OccurrencePage = () => {
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const [transportsList, setTransportsList] = useState([]);
  const [shipmentsList, setShipmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [formData, setFormData] = useState({
    type: 'ATRASO',
    description: '',
    attachment: 'Sem anexo',
    shipmentId: '',
    transportId: '',
    senderId: ''
  });

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const data = await occurrenceService.getAll();
      const uniqueData = data.map((item, index) => ({
        ...item,
        originalId: item.id,
        id: item.id ? `${item.id}-${index}` : `occ-${index}`
      }));
      setOccurrences(uniqueData);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
      showToast('Erro ao carregar ocorrências.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();

    const loadSelectData = async () => {
      try {
        const [transportsData, shipmentsData, usersData] = await Promise.all([
          transportService.getAll(),
          deliveryService.getAllPersonalized(),
          userService.getAllUsers()
        ]);
        const users = usersData || [];
        setTransportsList(transportsData || []);
        setShipmentsList(shipmentsData || []);
        setUsersList(users);

        if (users.length > 0) {
          const loggedEmail = authService.getCurrentUserEmail();
          const matchedUser = users.find(u => u.email === loggedEmail) || users[0];
          if (matchedUser) {
            setFormData(prev => ({ ...prev, senderId: matchedUser.id }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar seletores de ocorrência:", err);
      }
    };
    loadSelectData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await occurrenceService.create(formData);
      showToast('Ocorrência registrada com sucesso!', 'success');
      handleCloseModal();
      fetchOccurrences();
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      showToast('Erro ao registrar ocorrência.', 'error');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      type: 'ATRASO',
      description: '',
      attachment: 'Sem anexo',
      shipmentId: '',
      transportId: '',
      senderId: ''
    });
  };

  const filteredShipments = formData.transportId 
    ? shipmentsList.filter(s => s.transport?.id === formData.transportId || s.transportId === formData.transportId)
    : shipmentsList;

  const columns = [
    { label: 'Código', key: 'id', render: (row) => row.originalId ? row.originalId.substring(0, 8) : 'N/A' },
    { 
      label: 'Tipo', 
      key: 'type',
      render: (row) => {
        let statusClass = 'warning';
        if (row.type === 'ROUBO' || row.type === 'AVARIA') statusClass = 'danger';
        return (
          <span className={`status-chip ${statusClass}`}>
            {row.type}
          </span>
        );
      }
    },
    { label: 'Descrição do Incidente', key: 'description' },
    { 
      label: 'Entrega Vinculada', 
      key: 'shipmentId', 
      render: (row) => {
        if (row.shipment?.customer?.legalName) {
          return `${row.shipment.customer.legalName} (${row.shipment.typeOperation})`;
        }
        return row.shipment?.id ? row.shipment.id.substring(0, 8) : (row.shipmentId ? row.shipmentId.substring(0, 8) : '-');
      }
    },
    { 
      label: 'Viagem (Transporte)', 
      key: 'transportId', 
      render: (row) => {
        if (row.transport?.codeTransport) {
          return `Transporte #${row.transport.codeTransport}`;
        }
        return row.transport?.id ? row.transport.id.substring(0, 8) : (row.transportId ? row.transportId.substring(0, 8) : '-');
      }
    },
    { label: 'Relator / Emissor', key: 'senderName', render: (row) => row.sender?.name || 'Sistema' }
  ];

  const occurrenceFilterConfigs = [
    { key: 'type', label: 'Tipo' },
    { 
      key: 'senderName', 
      label: 'Relator',
      accessor: (row) => row.sender?.name || 'Sistema'
    }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Ocorrências & Incidentes Operacionais"
        description="Registro e tratativa de desvios de rota, avarias, atrasos e sinistros."
        icon={AlertTriangle}
        onBack={true}
      >
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Registrar Ocorrência
        </button>
      </PageHeader>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={occurrences} 
          loading={loading}
          itemsPerPage={12}
          filterConfigs={occurrenceFilterConfigs}
          emptyMessage="Nenhuma ocorrência registrada no sistema."
          searchPlaceholder="Pesquisar ocorrência por tipo, descrição ou código..."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} color="var(--status-danger-text)" />
                Registrar Nova Ocorrência
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  
                  <div className="form-group">
                    <label className="form-label">Tipo da Ocorrência</label>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleInputChange} 
                      className="form-select"
                      required
                    >
                      <option value="ATRASO">Atraso na Viagem / Entrega</option>
                      <option value="AVARIA">Avaria de Carga / Mercadoria</option>
                      <option value="DESVIO">Desvio de Rota Planejada</option>
                      <option value="ROUBO">Sinistro / Roubo / Furto</option>
                      <option value="OUTROS">Outros Incidentes</option>
                    </select>
                  </div>



                  <div className="form-group">
                    <label className="form-label">Viagem / Transporte (Opcional)</label>
                    <select 
                      name="transportId" 
                      value={formData.transportId} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="">Nenhum transporte vinculado</option>
                      {transportsList.map(t => (
                        <option key={t.id} value={t.id}>
                          Transporte #{t.codeTransport || t.id.substring(0, 8)} - {t.driver?.user?.name || 'Sem motorista'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Entrega (Opcional)</label>
                    <select 
                      name="shipmentId" 
                      value={formData.shipmentId} 
                      onChange={handleInputChange} 
                      className="form-select"
                    >
                      <option value="">Nenhuma entrega vinculada</option>
                      {filteredShipments.map(s => (
                        <option key={s.id} value={s.id}>
                          #{s.id.substring(0, 8)} - {s.customer?.legalName || 'Cliente'} ({s.typeOperation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Descrição Detalhada do Ocorrido</label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      className="form-textarea" 
                      rows="3"
                      placeholder="Descreva detalhadamente o incidente ocorrido na operação..."
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Link ou Caminho do Anexo (Foto / Boletim)</label>
                    <input 
                      type="text" 
                      name="attachment" 
                      value={formData.attachment} 
                      onChange={handleInputChange} 
                      className="form-input" 
                      placeholder="Sem anexo / https://link-foto.com"
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Registrar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default OccurrencePage;
