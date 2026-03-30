import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, MapPin, Truck, Package } from 'lucide-react';
import '../styles/Transport.css';

const INITIAL_DATA = [
  { id: "#100004", origin: "Atibaia - SP", currentDest: "Bauru - SP", eq1: "ERQ0B51", eq2: "MFU5H83", driver: "Felipe L.", status: "Em viagem" },
  { id: "#100049", origin: "Araras - SP", currentDest: "S. J. dos Campos - SP", eq1: "AAA1234", eq2: "CCC1122", driver: "Lucas S.", status: "Atrasado" },
  { id: "#100007", origin: "Araras - SP", currentDest: "Leme - SP", eq1: "GLP9I77", eq2: "MTU5H86", driver: "Jonathan A.", status: "Em entrega" },
  { id: "#100016", origin: "Limeira - SP", currentDest: "Leme - SP", eq1: "CNI5713", eq2: "KKP7L89", driver: "José M.", status: "Em viagem" },
  { id: "#100028", origin: "Limeira - SP", currentDest: "Fortaleza - CE", eq1: "CMI5U89", eq2: "KCI7E09", driver: "Matheus P.", status: "Em viagem" },
  { id: "#100060", origin: "Fortaleza - CE", currentDest: "Leme - SP", eq1: "MTU5H86", eq2: "GUKP9I17", driver: "Pogbá S.", status: "Em entrega",
    steps: [
      { label: "Depósito", type: "pin", status: "completed" },
      { label: "Fortaleza - CE", type: "package", status: "completed" },
      { label: "Leme - SP", type: "package", status: "active" },
      { label: "Araras - SP", type: "package", status: "pending" },
      { label: "Limeira - SP", type: "package", status: "pending" },
      { label: "Piracicaba - SP", type: "package", status: "pending" },
      { label: "Campinas - SP", type: "package", status: "pending" },
      { label: "São Paulo - SP", type: "package", status: "pending" },
      { label: "Guarujá - SP", type: "package", status: "pending" },
    ]
  },
  { id: "#100005", origin: "São Luis - MA", currentDest: "Araras - SP", eq1: "MCK4B45", eq2: "CHI5U99", driver: "Yuri A.", status: "Atrasado" },
  { id: "#100022", origin: "Limeira - SP", currentDest: "Niquelândia - GO", eq1: "KFM8A75", eq2: "RUE7A66", driver: "Rodrigo G.", status: "Em viagem" }
];

const TransportPage = () => {
  const [transports, setTransports] = useState(INITIAL_DATA);
  const [expandedRow, setExpandedRow] = useState("#100060"); // Default expanded from mockup

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
      {/* Header */}
      <div className="transport-header">
        <h2>Transporte</h2>
        <button className="create-transport-btn">
          <Plus size={18} /> Criar Transporte
        </button>
      </div>

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
          {transports.map((item) => {
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
          <strong>12</strong>
        </div>
        <div className="summary-item">
          <span>Total de entregas:</span>
          <strong>36</strong>
        </div>
        <div className="summary-item">
          <span>Equipamentos em atividade:</span>
          <strong>7</strong>
        </div>
        <div className="summary-item">
          <span>Equipamentos parados:</span>
          <strong>5</strong>
        </div>
        <div className="summary-item">
          <span>Atrasos:</span>
          <strong>3</strong>
        </div>
      </div>

    </div>
  );
};

export default TransportPage;
