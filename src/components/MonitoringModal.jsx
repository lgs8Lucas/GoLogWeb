import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  User,
  Clock,
  Route,
  Leaf,
  DollarSign,
  Calendar,
  CheckCircle2,
  Navigation,
  Info,
  Fuel,
  Factory,
  CalendarCheck
} from 'lucide-react';
import '../styles/MonitoringModal.css';
import { isStopDone } from '../utils/tripStatus';
import MapComponent from './MapComponent';
import InfoTip from './ui/InfoTip';
import { transportService } from '../services/transportService';

const fmtNum = (v, d = 1) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Valor realizado: carregando → "…"; com rota e sem fator cadastrado (null) → "sem fator". */
const realized = (ind, value, render) => {
  if (!ind) return '…';
  if (value === null || value === undefined) return 'sem fator';
  return render(value);
};

/** Mesma regra do backend: chegada até o horário agendado da remessa. */
const agendaStatus = (s) => {
  const sched = s.shedulind || s.schedulind;
  if (!sched) return null;
  const arrived = s.routeStop?.arrivedAt || s.routeStop?.departedAt;
  if (arrived) return new Date(arrived) <= new Date(sched) ? 'met' : 'late';
  return new Date() > new Date(sched) ? 'late' : null;
};

// Formata distância (metros -> km)
const formatDistance = (meters) => {
  if (meters == null) return '0.0 km';
  return `${(meters / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

// Formata tempo (segundos -> h m)
const formatDuration = (seconds) => {
  if (seconds == null || seconds === 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
};

const formatCurrency = (value) => {
  if (value == null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const MonitoringModal = ({ isOpen, onClose, vehicle }) => {
  const [activeTab, setActiveTab] = useState('etapas'); // 'etapas' | 'resumo' | 'ocorrencias'
  // Resultado guardado com o id da viagem: trocar de viagem volta a "carregando" sem setState no effect
  const [loaded, setLoaded] = useState({ id: null, data: null, error: false });
  const tripId = isOpen ? vehicle?.id : null;
  const lastAt = vehicle?.lastTelemetryAt || null;
  // Mantém o último resultado da mesma viagem enquanto recarrega após novo ponto de telemetria
  const indicators = loaded.id === tripId ? loaded.data : null;
  const indicatorsError = loaded.id === tripId && loaded.error;

  useEffect(() => {
    if (!tripId) return undefined;
    let cancelled = false;
    transportService.getIndicators(tripId)
      .then(data => { if (!cancelled) setLoaded({ id: tripId, data, error: false }); })
      .catch(() => { if (!cancelled) setLoaded({ id: tripId, data: null, error: true }); });
    return () => { cancelled = true; };
  }, [tripId, lastAt]);

  // Planejado + realizado (telemetria). Memoizado para o mapa não redesenhar a cada render.
  const polylines = useMemo(() => {
    if (!vehicle) return [];
    const lines = [{
      id: vehicle.id,
      coords: vehicle.routePlannedCoords || [],
      color: 'var(--secondary-color, #2ab29b)',
      label: `Viagem #${vehicle.code}`,
      vehicle: vehicle.position ? { ...vehicle.position, label: `${vehicle.plate} · ${vehicle.driver}` } : null,
      stops: vehicle.shipments?.map(s => {
        if (s.address && s.address.latitude && s.address.longitude) {
          return {
            coord: [parseFloat(s.address.latitude), parseFloat(s.address.longitude)],
            type: s.typeOperation,
            label: s.customer?.legalName || 'Cliente'
          };
        }
        return null;
      }).filter(Boolean) || []
    }];
    if (vehicle.routeCompletedCoords?.length > 1) {
      lines.push({ id: `${vehicle.id}-realizado`, variant: 'realized', coords: vehicle.routeCompletedCoords, color: '#6366f1', label: `Realizado #${vehicle.code}`, stops: [] });
    }
    return lines;
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  // Sem rota de telemetria o backend devolve tudo zerado; com erro de carga mostramos zero também
  const ind = indicatorsError ? { hasTelemetryRoute: false, distanceTraveledKm: 0, elapsedHours: 0, tonKm: 0, fuelLiters: 0, co2Kg: 0, effectiveCost: 0, schedule: null, cost: null, factors: {} } : indicators;
  const hasRoute = !!ind?.hasTelemetryRoute;
  const sched = ind?.schedule;
  const agendaText = sched ? (sched.scheduled > 0 ? `${sched.metOnTime} de ${sched.scheduled}` : 'sem agenda') : '…';

  const totalShipments = vehicle.shipments?.length || 0;
  const completedShipments = vehicle.shipments?.filter(isStopDone).length || 0;
  const occurrencesCount = vehicle.occurrences?.length || 0;

  const getStepStatus = (s) => {
    if (isStopDone(s)) return 'completed';
    if (s.status === 'INICIADO') return 'active';
    return 'pending';
  };

  const getOccClass = (type) => {
    switch (type) {
      case 'ROUBO':
      case 'AVARIA':
        return 'occ-danger';
      case 'ATRASO':
      case 'DESVIO':
        return 'occ-warning';
      default:
        return 'occ-info';
    }
  };

  return createPortal(
    <div className="monitoring-modal-overlay fade-in">
      <div className="monitoring-modal-content">
        {/* Header Elegante */}
        <div className="monitoring-modal-header">
          <div className="monitoring-header-left">
            <div className="monitoring-header-icon">
              <Navigation size={22} />
            </div>
            <div className="monitoring-header-titles">
              <h2>Acompanhamento da Viagem #{vehicle.code}</h2>
              <span className="monitoring-header-sub">
                Motorista: <strong>{vehicle.driver}</strong> &bull; Veículo: <strong>{vehicle.plate}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="status-chip active">
              {completedShipments} de {totalShipments} entregas concluídas
            </span>
            <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo Dividido em 2 Colunas */}
        <div className="monitoring-modal-body">
          {/* LADO ESQUERDO: Mapa Interativo com Legenda */}
          <div className="monitoring-modal-left">
            <div className="monitoring-map-wrapper">
              <MapComponent
                zoom={13}
                polylines={polylines}
              />
              <div className="monitoring-map-legend">
                <div className="monitoring-legend-item">
                  <div className="monitoring-legend-dot" style={{ backgroundColor: 'var(--secondary-color, #2ab29b)' }} />
                  <span>Trajeto Planejado</span>
                </div>
                {vehicle.routeCompletedCoords?.length > 1 && (
                  <div className="monitoring-legend-item">
                    <div className="monitoring-legend-dot" style={{ backgroundColor: '#6366f1' }} />
                    <span>Trajeto Realizado (telemetria)</span>
                  </div>
                )}
                <div className="monitoring-legend-item">
                  <div className="monitoring-legend-dot" style={{ backgroundColor: 'var(--status-active-text)' }} />
                  <span>Entregas / Coletas</span>
                </div>
                {vehicle.position && (
                  <div className="monitoring-legend-item">
                    <div className="monitoring-legend-dot" style={{ backgroundColor: 'var(--primary-color, #1f304c)' }} />
                    <span>
                      Última posição
                      {vehicle.position.at && ` · ${new Date(vehicle.position.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Painel de Informações e Roteiro */}
          <div className="monitoring-modal-right">
            {/* Faixa Superior de Métricas */}
            <div className="monitoring-metrics-strip">
              <div className="monitoring-strip-card">
                <div className="monitoring-strip-icon" style={{ backgroundColor: 'rgba(31, 48, 76, 0.08)', color: 'var(--primary-color)' }}>
                  <Route size={18} />
                </div>
                <div className="monitoring-strip-info">
                  <span className="monitoring-strip-label">Distância</span>
                  <span className="monitoring-strip-val">{formatDistance(vehicle.calculedDistance)}</span>
                </div>
              </div>

              <div className="monitoring-strip-card">
                <div className="monitoring-strip-icon" style={{ backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }}>
                  <Clock size={18} />
                </div>
                <div className="monitoring-strip-info">
                  <span className="monitoring-strip-label">Tempo Previsto</span>
                  <span className="monitoring-strip-val">{formatDuration(vehicle.totalTimeCalculed)}</span>
                </div>
              </div>

              <div className="monitoring-strip-card">
                <div className="monitoring-strip-icon" style={{ backgroundColor: 'var(--status-active-bg)', color: 'var(--status-active-text)' }}>
                  <DollarSign size={18} />
                </div>
                <div className="monitoring-strip-info">
                  <span className="monitoring-strip-label">Custo Estimado</span>
                  <span className="monitoring-strip-val">{formatCurrency(vehicle.totalCostCalculed)}</span>
                </div>
              </div>
            </div>

            {/* Indicadores realizados sobre a rota da telemetria (zerados sem rota) */}
            <div className="monitoring-realized-strip">
              <div className="monitoring-realized-head">
                <span>Realizado pela telemetria</span>
                {ind && !hasRoute && <span className="monitoring-realized-empty">sem rota recebida · indicadores zerados</span>}
                {hasRoute && <span className="monitoring-realized-empty">{fmtNum(ind.distanceTraveledKm)} km percorridos</span>}
              </div>
              <div className="monitoring-realized-grid">
                <div className="monitoring-realized-item" title="Σ toneladas a bordo × km de cada trecho recebido">
                  <Factory size={15} />
                  <span className="monitoring-strip-label">t·km</span>
                  <span className="monitoring-strip-val">{realized(ind, ind?.tonKm, v => fmtNum(v))}</span>
                </div>
                <div className="monitoring-realized-item" title="km percorridos ÷ consumo médio do veículo (km/L)">
                  <Fuel size={15} />
                  <span className="monitoring-strip-label">Combustível</span>
                  <span className="monitoring-strip-val">{realized(ind, ind?.fuelLiters, v => `${fmtNum(v)} L`)}</span>
                </div>
                <div className="monitoring-realized-item" title="km percorridos × kg CO₂/km do veículo">
                  <Leaf size={15} />
                  <span className="monitoring-strip-label">CO₂</span>
                  <span className="monitoring-strip-val">{realized(ind, ind?.co2Kg, v => `${fmtNum(v)} kg`)}</span>
                </div>
                <div className="monitoring-realized-item" title="km × custo/km + horas em rota × custo/hora + custo fixo do plano">
                  <DollarSign size={15} />
                  <span className="monitoring-strip-label">Custo efetivo</span>
                  <span className="monitoring-strip-val">{realized(ind, ind?.effectiveCost, formatCurrency)}</span>
                </div>
                <div className="monitoring-realized-item" title="Paradas com chegada até o horário agendado">
                  <CalendarCheck size={15} />
                  <span className="monitoring-strip-label">Agendas atendidas</span>
                  <span className="monitoring-strip-val">{agendaText}</span>
                </div>
              </div>
            </div>

            {/* Abas Internas */}
            <div className="monitoring-right-tabs">
              <button
                type="button"
                className={`monitoring-tab-button ${activeTab === 'etapas' ? 'active' : ''}`}
                onClick={() => setActiveTab('etapas')}
              >
                <Package size={16} />
                <span>Etapas da Rota ({totalShipments})</span>
              </button>

              <button
                type="button"
                className={`monitoring-tab-button ${activeTab === 'resumo' ? 'active' : ''}`}
                onClick={() => setActiveTab('resumo')}
              >
                <Info size={16} />
                <span>Resumo Operacional</span>
              </button>

              <button
                type="button"
                className={`monitoring-tab-button ${activeTab === 'ocorrencias' ? 'active' : ''}`}
                onClick={() => setActiveTab('ocorrencias')}
              >
                <AlertTriangle size={16} />
                <span>Ocorrências ({occurrencesCount})</span>
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="monitoring-tab-scroll">
              {/* ABA 1: Etapas da Rota (Timeline Elegante) */}
              {activeTab === 'etapas' && (
                <div className="modal-vertical-timeline">
                  {vehicle.shipments && vehicle.shipments.length > 0 ? (
                    vehicle.shipments.map((s, index) => {
                      const isColeta = s.typeOperation === 'COLETA';
                      const stepStatus = getStepStatus(s);
                      const isDone = stepStatus === 'completed';
                      const isActive = stepStatus === 'active';
                      const sched = s.shedulind || s.schedulind;
                      const agenda = agendaStatus(s);

                      return (
                        <div key={s.id || index} className={`modal-timeline-item ${stepStatus}`}>
                          <div className="modal-timeline-badge">
                            {isDone ? (
                              <CheckCircle2 size={16} color="var(--status-active-text)" />
                            ) : (
                              <span>{s.routeStop?.sequenceOrder || (index + 1)}</span>
                            )}
                            {isActive && <span className="active-ping"></span>}
                          </div>

                          <div className="modal-timeline-content">
                            <div className="modal-timeline-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span className={`status-chip ${isColeta ? 'warning' : 'info'}`} style={{ fontSize: '0.6875rem', padding: '0.15rem 0.45rem' }}>
                                  {isColeta ? 'Coleta' : 'Entrega'}
                                </span>
                                <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                                  {s.customer?.legalName || 'Cliente'}
                                </strong>
                              </div>

                              <span className={`status-badge-small ${stepStatus}`}>
                                {isDone ? 'Concluído' : isActive ? 'Em andamento' : 'Pendente'}
                              </span>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <MapPin size={13} color="var(--primary-color)" />
                              {s.address?.street ? `${s.address.street}, ${s.address.number || 'S/N'} - ` : ''}
                              {s.address?.city || s.customer?.address?.city || 'Araras'} ({s.address?.state || s.customer?.address?.state || 'SP'})
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>Carga: <strong>{s.weight || 0} kg</strong> / <strong>{s.volume || 0} m³</strong></span>
                              {sched && (
                                <span>Agendado: <strong>{new Date(sched).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                              )}
                              {agenda && (
                                <span className={`status-chip ${agenda === 'met' ? 'active' : 'danger'}`} style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem' }}>
                                  {agenda === 'met' ? 'Agenda atendida' : 'Fora da agenda'}
                                </span>
                              )}
                              {s.routeStop?.arrivedAt && (
                                <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  ✓ Chegada: {new Date(s.routeStop.arrivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  {s.routeStop.autoCheckIn ? ' (Geofence ' + (s.routeStop.checkInDistance ? Math.round(s.routeStop.checkInDistance) + 'm' : '') + ')' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {index < vehicle.shipments.length - 1 && (
                            <div className={`modal-timeline-connector ${isDone ? 'completed' : ''}`}></div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Package size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma remessa vinculada a esta rota planejada.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: Resumo Operacional (Grid de Informações) */}
              {activeTab === 'resumo' && (
                <div className="monitoring-overview-grid">
                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Motorista Alocado</span>
                    <span className="monitoring-kv-value">{vehicle.driver}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Equipamentos / Placa</span>
                    <span className="monitoring-kv-value">{vehicle.plate}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Distância Calculada</span>
                    <span className="monitoring-kv-value">{formatDistance(vehicle.calculedDistance)}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Duração Prevista em Trânsito</span>
                    <span className="monitoring-kv-value">{formatDuration(vehicle.travelDuration)}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Custo de Quilometragem Previsto</span>
                    <span className="monitoring-kv-value">{formatCurrency(vehicle.costKmCalculed)}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Custo de Horas Previsto</span>
                    <span className="monitoring-kv-value">{formatCurrency(vehicle.costHourCalculed)}</span>
                  </div>

                  <div className="monitoring-kv-card" style={{ gridColumn: '1 / -1' }}>
                    <span className="monitoring-kv-label">Custo Total Previsto da Operação</span>
                    <span className="monitoring-kv-value" style={{ fontSize: '1.1rem', color: 'var(--secondary-color)' }}>
                      {formatCurrency(vehicle.totalCostCalculed)}
                    </span>
                  </div>

                  <div className="monitoring-overview-section">
                    <span>Realizado pela rota da telemetria</span>
                    <InfoTip title="Como é calculado" align="left">
                      A distância e o t·km são acumulados pelo backend a cada ponto de telemetria recebido durante a viagem
                      (ruído de GPS e saltos impossíveis são descartados). Combustível, CO₂ e custo aplicam os fatores do
                      cadastro da frota. Sem rota recebida, tudo fica zerado; "sem fator" indica cadastro incompleto do veículo.
                    </InfoTip>
                  </div>

                  {ind && !hasRoute && (
                    <div className="monitoring-overview-note">
                      Nenhuma rota de telemetria recebida para esta viagem — indicadores realizados zerados.
                    </div>
                  )}

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Distância Percorrida</span>
                    <span className="monitoring-kv-value">{ind ? `${fmtNum(ind.distanceTraveledKm)} km` : '…'}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Tempo em Rota</span>
                    <span className="monitoring-kv-value">{ind ? formatDuration(Math.round(ind.elapsedHours * 3600)) : '…'}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Tonelada·km Realizada</span>
                    <span className="monitoring-kv-value">{realized(ind, ind?.tonKm, v => `${fmtNum(v)} t·km`)}</span>
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Consumo de Combustível</span>
                    <span className="monitoring-kv-value">{realized(ind, ind?.fuelLiters, v => `${fmtNum(v)} L`)}</span>
                    {hasRoute && ind.factors?.kmPerLiter > 0 && <span className="monitoring-kv-hint">{fmtNum(ind.factors.kmPerLiter)} km/L cadastrado</span>}
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">CO₂ Calculado</span>
                    <span className="monitoring-kv-value">{realized(ind, ind?.co2Kg, v => `${fmtNum(v)} kg`)}</span>
                    {hasRoute && ind.factors?.kgCo2PerKm != null && <span className="monitoring-kv-hint">{fmtNum(ind.factors.kgCo2PerKm, 3)} kg CO₂/km</span>}
                  </div>

                  <div className="monitoring-kv-card">
                    <span className="monitoring-kv-label">Custo Efetivo por Km</span>
                    <span className="monitoring-kv-value">{hasRoute ? realized(ind, ind.effectiveCostPerKm, formatCurrency) : formatCurrency(0)}</span>
                  </div>

                  <div className="monitoring-kv-card" style={{ gridColumn: '1 / -1' }}>
                    <span className="monitoring-kv-label">Paradas com Agenda Atendida</span>
                    <span className="monitoring-kv-value">
                      {!sched ? '…' : sched.scheduled === 0 ? 'Nenhuma parada com horário agendado' : (
                        <>
                          {sched.metOnTime} de {sched.scheduled}
                          {sched.onTimeRate != null && ` · ${fmtNum(sched.onTimeRate)}% no horário`}
                        </>
                      )}
                    </span>
                    {sched?.scheduled > 0 && (
                      <span className="monitoring-kv-hint">{sched.late} fora da agenda · {sched.pending} ainda no prazo</span>
                    )}
                  </div>

                  <div className="monitoring-kv-card" style={{ gridColumn: '1 / -1' }}>
                    <span className="monitoring-kv-label">Custo Efetivo da Operação</span>
                    <span className="monitoring-kv-value" style={{ fontSize: '1.1rem', color: 'var(--secondary-color)' }}>
                      {realized(ind, ind?.effectiveCost, formatCurrency)}
                    </span>
                    {hasRoute && ind.cost && (
                      <span className="monitoring-kv-hint">
                        Km {formatCurrency(ind.cost.kmCost)} · Horas {formatCurrency(ind.cost.hourCost)} · Fixo {formatCurrency(ind.cost.fixedCost)}
                        {vehicle.totalCostCalculed > 0 && ind.effectiveCost != null && ` · ${fmtNum((ind.effectiveCost / vehicle.totalCostCalculed) * 100, 0)}% do previsto`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 3: Ocorrências */}
              {activeTab === 'ocorrencias' && (
                <div className="route-occurrences">
                  {vehicle.occurrences && vehicle.occurrences.length > 0 ? (
                    vehicle.occurrences.map((occ, index) => (
                      <div key={occ.id || index} className={`route-occ-card ${getOccClass(occ.type)}`}>
                        <div className="occ-card-header">
                          <span className="occ-card-type" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <AlertTriangle size={14} />
                            {occ.type}
                          </span>
                          <span className="occ-card-user" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={12} />
                            {occ.sender?.name || 'Sistema'}
                          </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', lineHeight: 1.4 }}>{occ.description}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem', color: 'var(--status-active-text)' }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma ocorrência registrada nesta viagem.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MonitoringModal;
