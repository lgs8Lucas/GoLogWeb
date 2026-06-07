import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, MapPin, Truck, Package, ChevronLeft, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Transport.css';
import TransportModal from '../components/TransportModal';
import PageHeader from '../components/PageHeader';
import { transportService } from '../services/transportService';
import { deliveryService } from '../services/deliveryService';

const TransportPage = () => {
  const navigate = useNavigate();
  const [transports, setTransports] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const [transportsData, shipmentsData] = await Promise.all([
          transportService.getAll(),
          deliveryService.getAllPersonalized()
        ]);

        // Group shipments by transport ID
        const shipmentsByTransport = {};
        shipmentsData.forEach(s => {
          if (s.transport) {
            const tid = s.transport.id;
            if (!shipmentsByTransport[tid]) {
              shipmentsByTransport[tid] = [];
            }
            shipmentsByTransport[tid].push(s);
          }
        });

        const mapped = transportsData.map(t => {
          // Get shipments for this transport and sort by sequenceOrder
          const shipments = shipmentsByTransport[t.id] || [];
          shipments.sort((a, b) => {
            const seqA = a.routeStop?.sequenceOrder ?? 999;
            const seqB = b.routeStop?.sequenceOrder ?? 999;
            return seqA - seqB;
          });

          // Build dynamic steps from database shipments
          let steps = [];
          if (shipments.length > 0) {
            steps = shipments.map((s, index) => {
              const isColeta = s.typeOperation === 'COLETA';
              const label = `${isColeta ? 'Coleta' : 'Entrega'}: ${s.customer?.legalName || 'Cliente'} (${s.address?.city || s.customer?.address?.city || 'Araras'})`;
              
              let status = 'pending';
              if (s.status === 'DELIVERED' || s.status === 'COMPLETED') {
                status = 'completed';
              } else if (s.status === 'IN_TRANSIT' || s.status === 'ACTIVE') {
                status = 'active';
              } else {
                if (index === 0) status = 'completed';
                else if (index === 1) status = 'active';
                else status = 'pending';
              }

              return {
                label,
                status,
                type: isColeta ? 'package' : 'pin'
              };
            });
          } else {
            steps = [
              { label: 'Viagem planejada', status: 'active', type: 'package' }
            ];
          }

          // Determine origin and destination names based on shipments
          const cities = shipments.map(s => s.address?.city || s.customer?.address?.city || 'Araras');
          const origin = cities[0] || 'Origem';
          const destination = cities[cities.length - 1] || 'Destino';
          
          return {
            id: `#${t.codeTransport || (t.id ? t.id.substring(0, 8) : 'N/A')}`,
            origin: origin,
            currentDest: destination,
            eq1: t.equipamentGroup?.equipament1?.plate || 'Cavalo',
            eq2: t.equipamentGroup?.equipament2?.plate || '-',
            driver: t.driver?.user?.name || 'Sem motorista',
            status: t.timeStopped > 0 ? 'Atrasado' : 'Em viagem',
            shipmentQuantity: t.shipmentQuantity || shipments.length,
            steps: steps
          };
        });

        setTransports(mapped);
        if (mapped.length > 0) {
          setExpandedRow(mapped[0].id); // Expand first row by default
        }
      } catch (error) {
        console.error('Erro ao carregar transportes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransports();
  }, []);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderStatusBadge = (status) => {
    let className = 'badge-travel'; // Em viagem
    if (status === 'Atrasado') className = 'badge-delayed';
    if (status === 'Em entrega') className = 'badge-delivery';

    return (
      <span className={`transport-badge ${className}`}>
        {status === 'Atrasado' && <span className="warning-icon">⚠</span>}
        {status}
      </span>
    );
  };

  const renderStepper = (steps) => {
    return (
      <div className="stepper-container">
        {/* Main horizontal line behind all steps */}
        <div className="stepper-line-bg"></div>

        {steps.map((step, index) => {
          let lineClass = 'step-line pending';
          if (step.status === 'completed') lineClass = 'step-line completed';
          if (step.status === 'active') lineClass = 'step-line active-line'; // The line BEFORE the active node is usually completed, line AFTER is pending.

          // Icon choice
          let IconComponent = Package;
          if (step.type === 'pin') IconComponent = MapPin;
          
          return (
            <div key={index} className={`step-node ${step.status}`}>
              <div className="step-icon-wrapper">
                <IconComponent size={20} />
                {step.status === 'active' && (
                   // Small truck jumping over the active node
                   <Truck size={14} className="active-truck-icon" color="var(--primary-color)" />
                )}
              </div>
              <span className="step-label">{step.label}</span>
              {index < steps.length - 1 && (
                <div className={`step-connector ${step.status === 'completed' || step.status === 'active' ? 'completed-connector' : 'pending-connector'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="transport-page fade-in">
      <PageHeader 
        title="Transporte"
        description="Acompanhe e gerencie as viagens ativas e o status das entregas."
        icon={Navigation}
        onBack={true}
      >
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Criar Transporte
        </button>
      </PageHeader>

      {/* Main List */}
      <div className="transport-list">
        {/* Columns Header */}
        <div className="transport-list-header">
          <div className="col-id">Transporte</div>
          <div className="col-origin">Origem</div>
          <div className="col-dest">Destino Atual</div>
          <div className="col-eq">Equipamento 1</div>
          <div className="col-eq">Equipamento 2</div>
          <div className="col-driver">Motorista</div>
          <div className="col-status">Status</div>
          <div className="col-action"></div>
        </div>

        {/* Rows */}
        <div className="transport-rows">
          {loading ? (
             <div style={{padding:'2rem', textAlign:'center'}}>Carregando transportes...</div>
          ) : transports.map((item) => {
            const isExpanded = expandedRow === item.id;
            
            return (
              <div key={item.id} className={`transport-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="transport-card-main" onClick={() => toggleRow(item.id)}>
                  <div className="col-id font-semibold">{item.id}</div>
                  <div className="col-origin font-bold">{item.origin}</div>
                  <div className="col-dest font-bold">{item.currentDest}</div>
                  <div className="col-eq font-bold">{item.eq1}</div>
                  <div className="col-eq font-bold">{item.eq2}</div>
                  <div className="col-driver font-bold">{item.driver}</div>
                  <div className="col-status">{renderStatusBadge(item.status)}</div>
                  <div className="col-action">
                    <button className="expand-btn">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {isExpanded && item.steps && (
                  <div className="transport-card-details fade-in">
                    {renderStepper(item.steps)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="transport-footer-summary">
        <div className="summary-item">
          <span>Total de transportes:</span>
          <strong>{transports.length}</strong>
        </div>
        <div className="summary-item">
          <span>Total de entregas:</span>
          <strong>{transports.reduce((sum, t) => sum + (t.shipmentQuantity || 0), 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Equipamentos em atividade:</span>
          <strong>{transports.length}</strong>
        </div>
        <div className="summary-item">
          <span>Equipamentos parados:</span>
          <strong>0</strong>
        </div>
        <div className="summary-item">
          <span>Atrasos:</span>
          <strong>{transports.filter(t => t.status === 'Atrasado').length}</strong>
        </div>
      </div>

      {/* Modal */}
      <TransportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
};

export default TransportPage;
