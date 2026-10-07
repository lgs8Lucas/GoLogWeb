import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileUp, X, FileText, CheckCircle2, AlertTriangle, Code, UploadCloud, RefreshCw } from 'lucide-react';
import { invoiceIntegrationService } from '../services/invoiceIntegrationService';
import { useToast } from './ToastContext';

const EXAMPLE_JSON = [
  {
    "invoiceNumber": "10492",
    "series": "1",
    "accessKey": "35261012345678000190550010000104921000104921",
    "typeOperation": "ENTREGA",
    "weight": 250.0,
    "volume": 1.5,
    "value": 4890.00,
    "scheduledDate": new Date(Date.now() + 86400000).toISOString(),
    "notes": "Entregar em horário comercial na portaria 2",
    "customerName": "Atacadista São Bento Ltda",
    "customerDocument": "12345678000190",
    "customerEmail": "recebimento@saobento.com.br",
    "customerPhone": "(19) 3541-2000",
    "street": "Rua das Indústrias",
    "number": "450",
    "district": "Distrito Industrial",
    "city": "Araras",
    "state": "SP",
    "cep": "13600-000",
    "latitude": "-22.357123",
    "longitude": "-47.384567"
  }
];

const ImportInvoicesModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('xml'); // 'xml' | 'json'
  const [xmlFiles, setXmlFiles] = useState([]);
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []).filter(f => f.name.endsWith('.xml'));
    setXmlFiles(selected);
  };

  const handleImportXml = async () => {
    if (xmlFiles.length === 0) {
      showToast('Selecione ao menos um arquivo XML de NF-e.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await invoiceIntegrationService.importXmlFiles(xmlFiles);
      setResult(data);
      if (data.successCount > 0) {
        showToast(`${data.successCount} remessa(s) importada(s) com sucesso a partir de NF-e!`, 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast('Nenhuma remessa pôde ser criada a partir dos arquivos fornecidos.', 'error');
      }
    } catch (error) {
      console.error('Erro ao importar XMLs:', error);
      const msg = error.response?.data?.message || 'Erro ao processar arquivos XML de NF-e.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportJson = async () => {
    if (!jsonText.trim()) {
      showToast('Insira o payload JSON de faturas.', 'error');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      showToast('JSON inválido: verifique a sintaxe.', 'error');
      return;
    }

    const invoices = Array.isArray(parsed) ? parsed : (parsed.invoices || [parsed]);

    setLoading(true);
    setResult(null);
    try {
      const data = await invoiceIntegrationService.importJsonBatch(invoices);
      setResult(data);
      if (data.successCount > 0) {
        showToast(`${data.successCount} remessa(s) importada(s) com sucesso via ERP!`, 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast('Nenhuma remessa criada a partir do JSON.', 'error');
      }
    } catch (error) {
      console.error('Erro ao importar JSON:', error);
      const msg = error.response?.data?.message || 'Erro ao importar lote JSON.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileUp size={22} color="var(--primary-color)" />
            Middleware ERP / Importação de Cargas
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.5rem', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('xml'); setResult(null); }}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'xml' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'xml' ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: activeTab === 'xml' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={16} />
            NF-e (Arquivos XML da SEFAZ)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('json'); setResult(null); }}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'json' ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === 'json' ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: activeTab === 'json' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Code size={16} />
            Faturas ERP / WMS (JSON)
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab === 'xml' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Selecione os arquivos <code>.xml</code> de NF-e emitidos para gerar automaticamente as remessas, clientes e endereços de entrega.
              </p>

              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'rgba(79, 70, 229, 0.02)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('xml-file-input').click()}
              >
                <UploadCloud size={38} color="var(--primary-color)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>Clique ou arraste seus XMLs de NF-e aqui</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Suporta arquivos procNFe e NFe padrão SEFAZ 4.00
                </p>
                <input
                  id="xml-file-input"
                  type="file"
                  multiple
                  accept=".xml"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {xmlFiles.length > 0 && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span><strong>{xmlFiles.length}</strong> arquivo(s) selecionado(s)</span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setXmlFiles([])}
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Cole o array de faturas/pedidos gerados pelo ERP ou WMS:
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  onClick={() => setJsonText(JSON.stringify(EXAMPLE_JSON, null, 2))}
                >
                  Carregar Exemplo
                </button>
              </div>

              <textarea
                rows={9}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                placeholder='[ { "invoiceNumber": "123", "weight": 50.0, "customerName": "Cliente", ... } ]'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
            </div>
          )}

          {/* Feedback de Resultado da Importação */}
          {result && (
            <div className="fade-in" style={{
              padding: '0.9rem',
              borderRadius: '8px',
              backgroundColor: result.errorCount === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${result.errorCount === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                {result.errorCount === 0 ? (
                  <CheckCircle2 size={18} color="#10b981" />
                ) : (
                  <AlertTriangle size={18} color="#ef4444" />
                )}
                <strong>
                  Resultado: {result.successCount} de {result.totalReceived} remessas importadas com sucesso! ({result.processingTimeMs}ms)
                </strong>
              </div>
              {result.errors && result.errors.length > 0 && (
                <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', color: '#dc2626', fontSize: '0.8rem' }}>
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={activeTab === 'xml' ? handleImportXml : handleImportJson}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {loading && <RefreshCw size={16} className="spin" />}
            {loading ? 'Processando Lote...' : 'Importar Remessas'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImportInvoicesModal;
