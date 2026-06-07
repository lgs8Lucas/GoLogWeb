import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { occurrenceService } from '../services/occurrenceService';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';
import { userService } from '../services/userService';
import { useToast } from '../components/ToastContext';
import '../styles/Profiles.css'; // Reusing standard layout styling

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
        id: item.id ? `${item.id}-${index}` : `occ-${index}` // Fix duplicate keys while preserving originalId
      }));
      setOccurrences(uniqueData);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
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
        setTransportsList(transportsData || []);
        setShipmentsList(shipmentsData || []);
        setUsersList(usersData || []);
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
      setIsModalOpen(false);
      setFormData({
        type: 'ATRASO',
        description: '',
        attachment: 'Sem anexo',
        shipmentId: '',
        transportId: '',
        senderId: ''
      });
      fetchOccurrences();
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      let mensagens = 'Erro ao salvar ocorrência. Verifique se colou os UUIDs válidos e se a descrição tem no mínimo 5 caracteres.';
      if (Array.isArray(error.response?.data)) {
        mensagens = error.response.data.join('\n');
      } else if (error.response?.data?.message) {
        mensagens = error.response.data.message;
      }
      showToast(mensagens, 'error');
    }
  };

  const filteredShipments = formData.transportId 
    ? shipmentsList.filter(s => s.transport?.id === formData.transportId || s.transportId === formData.transportId)
    : shipmentsList;

  const columns = [
    { label: 'Código', key: 'id', render: (row) => row.originalId ? row.originalId.substring(0, 8) : 'N/A' },
    { label: 'Tipo', key: 'type' },
    { label: 'Descrição', key: 'description' },
    { 
      label: 'Entrega (Shipment)', 
      key: 'shipmentId', 
      render: (row) => {
        if (row.shipment?.customer?.legalName) {
          return `${row.shipment.customer.legalName} (${row.shipment.typeOperation})`;
        }
        return row.shipment?.id ? row.shipment.id.substring(0, 8) : (row.shipmentId ? row.shipmentId.substring(0, 8) : '-');
      }
    },
    { 
      label: 'Viagem (Transport)', 
      key: 'transportId', 
      render: (row) => {
        if (row.transport?.codeTransport) {
          return `Transporte #${row.transport.codeTransport}`;
        }
        return row.transport?.id ? row.transport.id.substring(0, 8) : (row.transportId ? row.transportId.substring(0, 8) : '-');
      }
    },
    { label: 'Criador', key: 'senderName', render: (row) => row.sender?.name || 'Sistema' }
  ];

  return (
    <div className="profiles-container fade-in">
      <PageHeader 
        title="Ocorrências"
        description="Gerencie os incidentes e anomalias registrados durante os transportes."
        icon={AlertTriangle}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Registrar Ocorrência
        </button>
      </PageHeader>

      <div className="profiles-content">
        <DataTable 
          columns={columns} 
          data={occurrences} 
          loading={loading}
          emptyMessage="Nenhuma ocorrência registrada até o momento."
        />
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Registrar Nova Ocorrência</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: '1.2rem' }}>
                
                <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                  <strong>Instrução:</strong> Selecione a viagem, remessa e operador correspondente nos campos suspensos abaixo.
                </div>

                <div className="form-group">
                  <label>Tipo de Ocorrência</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange} 
                    className="modal-input"
                    required
                  >
                    <option value="ATRASO">Atraso de Cronograma</option>
                    <option value="AVARIA">Avaria / Dano à Carga</option>
                    <option value="ROUBO">Roubo / Furto</option>
                    <option value="DESVIO">Desvio de Rota</option>
                    <option value="OUTROS">Outros Incidentes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Viagem (Transporte)</label>
                  <select 
                    name="transportId"
                    value={formData.transportId}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                  >
                    <option value="">Selecione a viagem...</option>
                    {transportsList.map((t, idx) => (
                      <option key={t.id || `transp-${idx}`} value={t.id}>
                        Transporte #{t.codeTransport || (t.id ? t.id.substring(0,8) : '')} - {t.driver?.user?.name || 'Sem motorista'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Entrega (Shipment)</label>
                  <select 
                    name="shipmentId"
                    value={formData.shipmentId}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                  >
                    <option value="">Selecione a entrega...</option>
                    {filteredShipments.map((s, idx) => (
                      <option key={s.id || `ship-${idx}`} value={s.id}>
                        Remessa #{s.codeShipment || (s.id ? s.id.substring(0,8) : '')} | {s.typeOperation}: {s.customer?.legalName} ({s.address?.city || 'Araras'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Operador Responsável</label>
                  <select 
                    name="senderId"
                    value={formData.senderId}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                  >
                    <option value="">Selecione o operador...</option>
                    {usersList.map((u, idx) => (
                      <option key={u.id || `user-${idx}`} value={u.id}>
                        {u.name} ({u.userProfile})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Descrição (Mín. 5 letras)</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                    minLength={5}
                    rows="3"
                    placeholder="Descreva detalhadamente o incidente..."
                  />
                </div>

                <div className="form-group">
                  <label>Anexo / Imagem URL (Mín. 5 letras)</label>
                  <input 
                    type="text" 
                    name="attachment"
                    value={formData.attachment}
                    onChange={handleInputChange}
                    className="modal-input" 
                    minLength={5}
                    placeholder="URL ou link do comprovante..."
                  />
                </div>
                
                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save" style={{ padding: '0.75rem 1.5rem', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    Registrar
                  </button>
                </div>
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
