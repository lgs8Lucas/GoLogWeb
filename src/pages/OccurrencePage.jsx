import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { occurrenceService } from '../services/occurrenceService';
import '../styles/Profiles.css'; // Reusing standard layout styling

const OccurrencePage = () => {
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ATRASO',
    description: '',
    attachment: 'Sem anexo',
    shipmentId: '',
    transportId: '',
    senderId: 'c916e36f-4846-41be-9b32-9e0ff8850a29' // Pre-populated with Admin Master ID from gologdb.sql
  });

  const fetchOccurrences = async () => {
    setLoading(true);
    try {
      const data = await occurrenceService.getAll();
      setOccurrences(data);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await occurrenceService.create(formData);
      alert('Ocorrência registrada com sucesso!');
      setIsModalOpen(false);
      setFormData({
        type: 'ATRASO',
        description: '',
        attachment: 'Sem anexo',
        shipmentId: '',
        transportId: '',
        senderId: 'c916e36f-4846-41be-9b32-9e0ff8850a29'
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
      alert(mensagens);
    }
  };

  const columns = [
    { label: 'Código', key: 'id', render: (row) => row.id ? row.id.substring(0, 8) : 'N/A' },
    { label: 'Tipo', key: 'type' },
    { label: 'Descrição', key: 'description' },
    { label: 'Entrega (Shipment)', key: 'shipmentId', render: (row) => row.shipment?.id ? row.shipment.id.substring(0, 8) : (row.shipmentId ? row.shipmentId.substring(0, 8) : '-') },
    { label: 'Viagem (Transport)', key: 'transportId', render: (row) => row.transport?.id ? row.transport.id.substring(0, 8) : (row.transportId ? row.transportId.substring(0, 8) : '-') },
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
                
                <div style={{ background: 'var(--bg-hover)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--warning-color)' }}>
                  <strong>Importante:</strong> Cole os UUIDs válidos correspondentes do banco de dados para realizar a vinculação correta.
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
                  <label>UUID Viagem (Transport ID)</label>
                  <input 
                    type="text" 
                    name="transportId"
                    value={formData.transportId}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                    placeholder="Cole o UUID da Viagem..."
                  />
                </div>

                <div className="form-group">
                  <label>UUID Entrega (Shipment ID)</label>
                  <input 
                    type="text" 
                    name="shipmentId"
                    value={formData.shipmentId}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                    placeholder="Cole o UUID da Entrega..."
                  />
                </div>

                <div className="form-group">
                  <label>UUID Operador Responsável (Sender ID)</label>
                  <input 
                    type="text" 
                    name="senderId"
                    value={formData.senderId}
                    onChange={handleInputChange}
                    className="modal-input" 
                    required 
                  />
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
