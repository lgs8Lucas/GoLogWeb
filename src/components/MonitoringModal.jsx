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
  DollarSign,
  Calendar,
  CheckCircle2,
  Navigation,
  Info
} from 'lucide-react';
import OccurrenceCard from './OccurrenceCard';
import { sortOccurrences } from '../utils/occurrence';
import '../styles/MonitoringModal.css';
import { isStopDone } from '../utils/tripStatus';
import { translateStatus } from '../utils/enumTranslations';
import MapComponent from './MapComponent';
import InfoTip from './ui/InfoTip';
import { transportService } from '../services/transportService';
import { plannedTonKm } from '../utils/tripPlan';
import { decodePolyline } from '../utils/polyline';

const fmtNum = (v, d = 1) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Mesma regra do backend: chegada por geofence até o horário agendado (antecipada conta como no prazo). */
const agendaStatus = (s) => {
  const sched = s.shedulind || s.schedulind;
  if (!sched) return null;
  const arrived = s.routeStop?.arrivedAt;
  if (arrived) return new Date(arrived) <= new Date(sched) ? 'met' : 'late';
  return new Date() > new Date(sched) ? 'late' : null;
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

const fmtKm = (km) => `${fmtNum(km || 0)} km`;
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

/** Variação do efetivo sobre o calculado: vermelho acima do plano, verde abaixo. */
const DeltaBadge = ({ value, planned }) => {
  if (value == null || !(planned > 0)) return null;
  const pct = Math.round(((value - planned) / planned) * 100);
  const cls = pct > 0 ? 'over' : 'under';
  return <span className={`monitoring-delta monitoring-delta--${cls}`}>{pct > 0 ? '+' : ''}{pct.toLocaleString('pt-BR')}%</span>;
};

/** Cards de indicadores no mesmo padrão para o plano e para o realizado. */
const IndicatorCards = ({ data, loading = false, planned = null }) => {
  const show = (value, render) => {
    if (loading) return '…';
    if (value === null || value === undefined) return data.factorsReady ? 'sem fator' : '…';
    return render(value);
  };
  const b = data.breakdown;
  return (
    <>
      <div className="monitoring-kv-card">
        <span className="monitoring-kv-label">Distância</span>
        <span className="monitoring-kv-value">{loading ? '…' : fmtKm(data.km)}</span>
      </div>
      <div className="monitoring-kv-card">
        <span className="monitoring-kv-label">Tempo Total</span>
        <span className="monitoring-kv-value">{loading ? '…' : formatDuration(data.seconds)}</span>
        {data.transitSeconds > 0 && <span className="monitoring-kv-hint">{formatDuration(data.transitSeconds)} em trânsito</span>}
      </div>
      <div className="monitoring-kv-card">
        <span className="monitoring-kv-label">Tonelada·km</span>
        <span className="monitoring-kv-value">{loading ? '…' : data.tonKm == null ? 'sem trechos no plano' : `${fmtNum(data.tonKm)} t·km`}</span>
      </div>
      <div className="monitoring-kv-card">
        <span className="monitoring-kv-label">Combustível</span>
        <span className="monitoring-kv-value">{show(data.fuelLiters, v => `${fmtNum(v)} L`)}</span>
      </div>
      <div className="monitoring-kv-card">
        <span className="monitoring-kv-label">CO₂</span>
        <span className="monitoring-kv-value">{show(data.co2Kg, v => `${fmtNum(v)} kg`)}</span>
      </div>
      <div className="monitoring-kv-card">
        <span className="monitoring-kv-label">Custo por Km</span>
        <span className="monitoring-kv-value">{show(data.costPerKm, formatCurrency)}</span>
      </div>
      <div className="monitoring-kv-card" style={{ gridColumn: '1 / -1' }}>
        <span className="monitoring-kv-label">Custo Total</span>
        <span className="monitoring-kv-value" style={{ fontSize: '1.1rem', color: 'var(--secondary-color)' }}>
          {show(data.cost, formatCurrency)}
        </span>
        {!loading && b && (
          <span className="monitoring-kv-hint">
            Km {formatCurrency(b.kmCost)} · Horas {formatCurrency(b.hourCost)} · Fixo {formatCurrency(b.fixedCost)}
            {planned?.cost > 0 && data.cost != null && ` · ${fmtNum((data.cost / planned.cost) * 100, 0)}% do previsto`}
          </span>
        )}
      </div>
    </>
  );
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

  // Rota realizada montada pelo backend com os pontos de telemetria do transport_id da viagem;
  // enquanto carrega, usa a gravada na viagem
  const completedCoords = useMemo(
    () => (indicators?.routeCompleted ? decodePolyline(indicators.routeCompleted) : (vehicle?.routeCompletedCoords || [])),
    [indicators, vehicle]
  );

  // Planejado + realizado (telemetria). Memoizado para o mapa não redesenhar a cada render.
  const polylines = useMemo(() => {
    if (!vehicle) return [];
    const lines = [{
      id: vehicle.id,
      coords: vehicle.routePlannedCoords || [],
      color: 'var(--secondary-color, #2ab29b)',
      label: `Viagem #${vehicle.code}`,
      vehicle: vehicle.position ? { ...vehicle.position, label: `${vehicle.plate} · ${vehicle.driver}` } : null,
      stops: vehicle.shipments?.map((s, idx) => {
        const addr = s.address || s.customer?.address;
        if (addr && addr.latitude && addr.longitude) {
          return {
            coord: [parseFloat(addr.latitude), parseFloat(addr.longitude)],
            type: s.typeOperation,
            label: s.customer?.legalName || 'Cliente',
            sequence: s.routeStop?.sequenceOrder ?? (idx + 1),
            status: s.status,
            statusLabel: translateStatus(s.status)
          };
        }
        return null;
      }).filter(Boolean) || []
    }];
    if (completedCoords.length > 1) {
      lines.push({ id: `${vehicle.id}-realizado`, variant: 'realized', coords: completedCoords, color: '#6366f1', label: `Realizado #${vehicle.code}`, stops: [] });
    }
    return lines;
  }, [vehicle, completedCoords]);

  if (!isOpen || !vehicle) return null;

  // Sem rota de telemetria o backend devolve tudo zerado; com erro de carga mostramos zero também
  const ind = indicatorsError ? { hasTelemetryRoute: false, distanceTraveledKm: 0, elapsedHours: 0, tonKm: 0, fuelLiters: 0, co2Kg: 0, effectiveCost: 0, schedule: null, cost: null, factors: {} } : indicators;
  const hasRoute = !!ind?.hasTelemetryRoute;
  const sched = ind?.schedule;

  // Mesmo conjunto de indicadores para o plano e para o realizado (faixa de comparação e aba Resumo)
  const factors = ind?.factors || {};
  const planKm = (vehicle.calculedDistance || 0) / 1000;
  const planCost = vehicle.totalCostCalculed || 0;
  const plan = {
    km: planKm,
    seconds: vehicle.totalTimeCalculed || 0,
    transitSeconds: vehicle.travelDuration || 0,
    tonKm: plannedTonKm(vehicle.shipments),
    fuelLiters: factors.kmPerLiter > 0 ? planKm / factors.kmPerLiter : null,
    co2Kg: factors.kgCo2PerKm != null ? planKm * factors.kgCo2PerKm : null,
    cost: planCost,
    costPerKm: planKm > 0 ? planCost / planKm : null,
    breakdown: {
      kmCost: vehicle.costKmCalculed || 0,
      hourCost: vehicle.costHourCalculed || 0,
      fixedCost: Math.max(0, planCost - (vehicle.costKmCalculed || 0) - (vehicle.costHourCalculed || 0))
    },
    factorsReady: !!ind
  };
  const eff = {
    km: hasRoute ? ind.distanceTraveledKm : 0,
    seconds: hasRoute ? Math.round(ind.elapsedHours * 3600) : 0,
    tonKm: hasRoute ? ind.tonKm : 0,
    fuelLiters: hasRoute ? ind.fuelLiters : 0,
    co2Kg: hasRoute ? ind.co2Kg : 0,
    cost: hasRoute ? ind.effectiveCost : 0,
    costPerKm: hasRoute ? ind.effectiveCostPerKm : 0,
    breakdown: hasRoute ? ind.cost : null,
    factorsReady: true
  };

  const totalShipments = vehicle.shipments?.length || 0;
  const completedShipments = vehicle.shipments?.filter(isStopDone).length || 0;
  const occurrencesCount = vehicle.occurrences?.length || 0;
  const sortedOccurrences = sortOccurrences(vehicle.occurrences || []);
  const shipmentById = Object.fromEntries((vehicle.shipments || []).map(s => [s.id, s]));

  const getStepStatus = (s) => {
    if (isStopDone(s)) return 'completed';
    if (s.status === 'INICIADO') return 'active';
    return 'pending';
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
                {completedCoords.length > 1 && (
                  <div className="monitoring-legend-item">
                    <div className="monitoring-legend-dot" style={{ backgroundColor: '#6366f1' }} />
                    <span>Trajeto Realizado (telemetria){hasRoute && ` · ${fmtKm(ind.distanceTraveledKm)}`}</span>
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
            {/* Calculado (plano do otimizador) × Efetivo (rota da telemetria) */}
            <div className="monitoring-compare">
              <span />
              <span className="monitoring-compare-head"><Route size={13} /> Distância</span>
              <span className="monitoring-compare-head"><Clock size={13} /> Tempo</span>
              <span className="monitoring-compare-head"><DollarSign size={13} /> Custo</span>

              <span className="monitoring-compare-tag">Calculado</span>
              <span className="monitoring-compare-val">{fmtKm(plan.km)}</span>
              <span className="monitoring-compare-val">{formatDuration(plan.seconds)}</span>
              <span className="monitoring-compare-val">{formatCurrency(plan.cost)}</span>

              <span className="monitoring-compare-tag monitoring-compare-tag--effective">Efetivo</span>
              {[
                [eff.km, plan.km, fmtKm],
                [eff.seconds, plan.seconds, formatDuration],
                [eff.cost, plan.cost, formatCurrency]
              ].map(([value, planned, render], i) => (
                <span key={i} className="monitoring-compare-val">
                  {!ind ? '…' : !hasRoute || value == null ? '—' : render(value)}
                  <DeltaBadge value={hasRoute ? value : null} planned={planned} />
                </span>
              ))}
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

                  <div className="monitoring-overview-section">
                    <span>Indicadores calculados</span>
                    <span className="monitoring-overview-section-sub">plano do otimizador</span>
                    <InfoTip title="Como é calculado" align="left">
                      Valores do plano gerado pelo otimizador de rotas. O t·km soma, trecho a trecho, as toneladas a bordo
                      × km do trecho planejado. Combustível e CO₂ aplicam aos km planejados os fatores do cadastro da frota.
                    </InfoTip>
                  </div>
                  <IndicatorCards data={plan} />

                  <div className="monitoring-overview-section monitoring-overview-section--effective">
                    <span>Indicadores efetivos</span>
                    <span className="monitoring-overview-section-sub">rota realizada pela telemetria</span>
                    <InfoTip title="Como é calculado" align="left">
                      A distância e o t·km são acumulados pelo backend a cada ponto de telemetria recebido durante a viagem
                      (ruído de GPS e saltos impossíveis são descartados). Combustível, CO₂ e custo aplicam os fatores do
                      cadastro da frota. Sem rota recebida, tudo fica zerado; "sem fator" indica cadastro incompleto do veículo.
                    </InfoTip>
                  </div>

                  <div className="monitoring-kv-card" style={{ gridColumn: '1 / -1' }}>
                    <span className="monitoring-kv-label">Rota Realizada</span>
                    <span className="monitoring-kv-value">
                      {!ind ? '…' : hasRoute ? `${fmtKm(ind.distanceTraveledKm)} percorridos` : 'Nenhuma rota de telemetria recebida'}
                    </span>
                    <span className="monitoring-kv-hint">
                      {hasRoute
                        ? `Rastreada de ${fmtDateTime(ind.trackingStartedAt)} até ${fmtDateTime(ind.lastTelemetryAt)}`
                        : ind ? 'Indicadores efetivos zerados até chegar o primeiro ponto da viagem.' : ''}
                    </span>
                  </div>
                  <IndicatorCards data={eff} loading={!ind} planned={plan} />

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
                </div>
              )}

              {/* ABA 3: Ocorrências */}
              {activeTab === 'ocorrencias' && (
                <div className="route-occurrences">
                  {sortedOccurrences.length > 0 ? (
                    <div className="occ-list">
                      {sortedOccurrences.map((occ, index) => (
                        <OccurrenceCard
                          key={occ.id || index}
                          occurrence={occ}
                          shipment={shipmentById[occ.shipmentId || occ.shipment?.id]}
                          senderName={occ.senderId && occ.senderId === vehicle.driverUserId ? vehicle.driver : undefined}
                        />
                      ))}
                    </div>
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
